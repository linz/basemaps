import { fileURLToPath } from 'node:url';

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { sha256base58 } from '@basemaps/config';
import { fsa, FsHttp } from '@chunkd/fs';
import { AwsCredentialConfig, AwsS3CredentialProvider, FsAwsS3 } from '@chunkd/fs-aws';
import { SourceCache, SourceChunk } from '@chunkd/middleware';
import type { SourceCallback, SourceRequest } from '@chunkd/source';
import type { RequestSigner } from '@smithy/types';

import { Env } from './const.js';
import { Fqdn } from './file.system.middleware.js';
import { LogConfig } from './log.js';

const s3Client = new S3Client({
  /**
   * We have buckets in multiple regions. We don’t know ahead of time which region each bucket is in
   *
   * So, the S3 Client will have to follow the endpoints. This adds a bit of extra latency as requests have to be retried
   */
  followRegionRedirects: true,
});

/** Exported for testing */
export const s3Config = {
  client: s3Client,
  getSignedUrl,
};

export const s3Fs = new FsAwsS3(s3Client);

// For public URLS use --no-sign-request
export const s3FsPublic = new FsAwsS3(
  new S3Client({
    followRegionRedirects: true,
    signer: {
      sign: (req) => Promise.resolve(req),
    } as RequestSigner,
  }),
);

/**
 * Sign a GET request to S3 for one hour
 * @param target s3 location to presign
 * @returns
 */
export async function signS3Get(target: URL): Promise<string> {
  if (target.protocol !== 's3:') throw new Error(`Presigning only works for S3 URLs, got ${target.href}`);
  const command = new GetObjectCommand({ Bucket: target.host, Key: target.pathname.slice(1) });
  return await s3Config.getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// For public URLS use --no-sign-request
/** Ensure middleware are added to all s3 clients that are created */
function applyS3MiddleWare(fs: FsAwsS3): void {
  if (fs.s3 == null) return;
  const stacks = fs.s3.middlewareStack.identify();
  if (stacks.find((f) => f.startsWith('FQDN - ')) == null) {
    fs.s3.middlewareStack.add(Fqdn.middleware, { name: 'FQDN', step: 'finalizeRequest' });
  }
}

applyS3MiddleWare(s3FsPublic);
applyS3MiddleWare(s3Fs);

const credentials = new AwsS3CredentialProvider();

credentials.onFileSystemFound = (acc: AwsCredentialConfig, fs?: FsAwsS3, path?: URL): void => {
  if (fs == null) return;
  LogConfig.get().info({ prefix: acc.prefix, roleArn: acc.roleArn, path: path?.href }, 'FileSystem:Register');
  applyS3MiddleWare(fs);
  fsa.register(acc.prefix, fs);
};

/**
 * Split JSON or comma separated lists into individual components
 *
 * Allowing for credentials to be loaded from multiple sources eg
 *
 * @example comma separated list
 * ```typescript
 * "s3://foo/bar.json,s3://foo/baz.json"
 * ```
 */
function splitConfig(x: string): string[] {
  if (x.startsWith('[')) return JSON.parse(x) as string[];
  return x.split(',');
}
const credentialPath = Env.get(Env.AwsRoleConfigPath);
if (credentialPath) {
  for (const loc of splitConfig(credentialPath)) credentials.registerConfig(fsa.toUrl(loc), s3Fs);
}

s3Fs.credentials = credentials;

fsa.register('https://', new FsHttp());
fsa.register('s3://', s3Fs);

export const Fsa = fsa;

export const FsaChunk = new SourceChunk({ size: 128 * 1024 });
fsa.middleware.push(FsaChunk);

export const FsaCache = new SourceCache({ size: 256 * 1024 * 1024 }); // 256MB of cache
fsa.middleware.push(FsaCache);

// Logging middleware
export const FsaLog = {
  name: 'logger',
  count: 0,
  requests: [] as string[],
  async fetch(req: SourceRequest, next: SourceCallback): Promise<ArrayBuffer> {
    this.count++;
    const requestId = sha256base58(
      JSON.stringify({ source: req.source.url.href, offset: req.offset, length: req.length }),
    );
    this.requests.push(requestId);
    const startTime = performance.now();
    const res = await next(req);
    LogConfig.get().debug(
      {
        source: req.source.url.href,
        sourceHost: req.source.url.hostname,
        offset: req.offset,
        length: req.length,
        requestId,
        duration: performance.now() - startTime,
      },
      'fetch',
    );
    return res;
  },

  reset(): void {
    this.count = 0;
    this.requests = [];
  },
};
fsa.middleware.push(FsaLog);

/**
 * Middleware to cache responses locally into .cache/
 *
 * very useful when developing with remote sources as it avoids repeatedly downloading the same data
 */
export const FsaLocalCache = {
  name: 'source:local-cache',
  remotes: new Set<string>(['s3:', 'http:', 'https:']),
  async fetch(req: SourceRequest, next: SourceCallback): Promise<ArrayBuffer> {
    if (this.remotes.has(req.source.url.protocol) === false) return next(req);

    const requestId = sha256base58(
      JSON.stringify({ source: req.source.url.href, offset: req.offset, length: req.length }),
    );
    const cacheUrl = fsa.toUrl(`./.cache/${requestId}`);
    const bytes = await fsa.read(cacheUrl).catch(() => {});
    if (bytes) return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

    return next(req).then(async (res) => {
      await fsa.write(cacheUrl, Buffer.from(res)).catch(() => {});
      return res;
    });
  },
};

/**
 * When chunkd moves to URLs this can be removed
 *
 * But reading a file as a string with `file://....` does not work in node
 * it needs to be converted with `fileURLToPath`
 */
export function urlToString(u: URL): string {
  if (u.protocol === 'file:') return fileURLToPath(u);
  return u.href;
}

/**
 *  Ensure a folder has a trailing slash
 **/
export function stringToUrlFolder(str: string): URL {
  const url = fsa.toUrl(str);
  if (url.pathname.endsWith('/')) return url;
  return new URL(url.href + '/');
}

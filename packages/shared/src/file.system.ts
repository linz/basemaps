import { fileURLToPath } from 'node:url';

import { S3Client } from '@aws-sdk/client-s3';
import { sha256base58 } from '@basemaps/config';
import { fsa, FsHttp } from '@chunkd/fs';
import { AwsCredentialConfig, AwsS3CredentialProvider, FsAwsS3 } from '@chunkd/fs-aws';
import { SourceCache, SourceChunk } from '@chunkd/middleware';
import type { SourceCallback, SourceRequest } from '@chunkd/source';
import type { RequestSigner } from '@smithy/types';

import { Env } from './const.js';
import { Fqdn } from './file.system.middleware.js';
import { LogConfig } from './log.js';

export const s3Fs = new FsAwsS3(
  new S3Client({
    /**
     * We buckets in multiple regions we do not know ahead of time which bucket is in what region
     *
     * So the S3 Client will have to follow the endpoints, this adds a bit of extra latency as requests have to be retried
     */
    followRegionRedirects: true,
  }),
);

// For public URLS use --no-sign-request
export const s3FsPublic = new FsAwsS3(
  new S3Client({
    followRegionRedirects: true,
    signer: {
      sign: (req) => Promise.resolve(req),
    } as RequestSigner,
  }),
);

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
fsa.register('s3://nz-imagery', s3FsPublic);
fsa.register('s3://nz-elevation', s3FsPublic);
fsa.register('s3://nz-coastal', s3FsPublic);

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

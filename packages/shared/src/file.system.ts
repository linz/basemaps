import { fileURLToPath } from 'node:url';

import { S3Client } from '@aws-sdk/client-s3';
import { sha256base58 } from '@basemaps/config';
import { FileSystem, fsa, FsHttp } from '@chunkd/fs';
import { AwsCredentialConfig, AwsS3CredentialProvider, FsAwsS3 } from '@chunkd/fs-aws';
import { SourceCache, SourceChunk } from '@chunkd/middleware';
import type { SourceCallback, SourceRequest } from '@chunkd/source';
import type { RequestSigner } from '@smithy/types';

import { Env } from './const.js';
import { LogConfig } from './log.js';

export const s3Fs = new FsAwsS3(new S3Client());

// For public URLS use --no-sign-request
export const s3FsPublic = new FsAwsS3(
  new S3Client({
    signer: {
      sign: async (req) => req,
    } as RequestSigner,
  }),
);

const credentials = new AwsS3CredentialProvider();

credentials.onFileSystemCreated = (acc: AwsCredentialConfig, fs: FileSystem): void => {
  LogConfig.get().debug({ prefix: acc.prefix, roleArn: acc.roleArn }, 'FileSystem:Register');
  fsa.register(acc.prefix, fs);
};

const credentialPath = Env.get(Env.AwsRoleConfigPath);
if (credentialPath) credentials.registerConfig(fsa.toUrl(credentialPath), s3Fs);

s3Fs.credentials = credentials;

fsa.register('https://', new FsHttp());
fsa.register('s3://', s3Fs);
fsa.register('s3://nz-imagery', s3FsPublic);
fsa.register('s3://nz-elevation', s3FsPublic);

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

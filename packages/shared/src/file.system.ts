import { fileURLToPath } from 'node:url';

import { S3Client } from '@aws-sdk/client-s3';
import { FileSystem, fsa } from '@chunkd/fs';
import { AwsCredentialConfig, AwsS3CredentialProvider, FsAwsS3 } from '@chunkd/fs-aws';

import { Env } from './const.js';
import { LogConfig } from './log.js';

export const s3Fs = new FsAwsS3(new S3Client());

export const s3FsPublic = new FsAwsS3(
  new S3Client({
    // TODO need to fix this as it cannot find "HttpRequest"
    //     signer: {
    //       async sign(req: HttpRequest): Promise<HttpRequest> {
    //         return req;
    //       },
    //     },
    //   }),
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

fsa.register('s3://', s3Fs);
fsa.register('s3://nz-imagery', s3FsPublic);

export const Fsa = fsa;

// FIXME add middleware to cache requests

// FIXME add tests / docs
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

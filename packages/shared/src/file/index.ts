export * from './file.config.js';

import { parseUri, FileSystem } from '@chunkd/core';
import { fsa as fsaSource } from '@chunkd/fs';
import { FsAwsS3 } from '@chunkd/source-aws';
import { AwsCredentials, CredentialSource, FsAwsS3ProviderV2 } from '@chunkd/source-aws-v2';
import S3 from 'aws-sdk/clients/s3.js';
import { promisify } from 'util';
import { createGzip, gunzip } from 'zlib';
import { Env } from '../const.js';
import { LogConfig } from '../log.js';
import { FileConfig, isConfigS3Role } from './file.config.js';

const pGunzip = promisify(gunzip) as (data: Buffer) => Promise<Buffer>;

export type FsaJson = typeof fsaSource & {
  /** Attempt to read a location, if it fails with 403, then lookup role using RoleRegister */
  attemptRead(filePath: string, roleLookup?: boolean): Promise<Buffer>;
  readJson<T>(filePath: string): Promise<T>;
  writeJson<T>(filePath: string, obj: T): Promise<void>;
  /** Add a file system configuration */
  configure(fs: FileConfig): void;
};

export const fsa = fsaSource as any as FsaJson;

fsa.readJson = async function readJson<T>(filePath: string): Promise<T> {
  const data = await this.read(filePath);
  if (filePath.endsWith('.gz')) {
    return JSON.parse((await pGunzip(data)).toString()) as T;
  } else {
    return JSON.parse(data.toString()) as T;
  }
};

fsa.writeJson = async function writeJson<T>(filePath: string, obj: T): Promise<void> {
  const json = Buffer.from(JSON.stringify(obj, undefined, 2));
  if (filePath.endsWith('.gz')) {
    const gzip = createGzip();
    gzip.end(json);
    return this.write(filePath, gzip);
  } else {
    return this.write(filePath, json);
  }
};

fsa.configure = function configure(cfg: FileConfig): void {
  if (cfg.type !== 's3') return; // ignore local configs
  if (!isConfigS3Role(cfg)) return; // ignore configs which don't need role assumptions

  const res = parseUri(cfg.path);
  if (res == null) throw new Error('Failed to parse URI: ' + cfg.path);
  const bucketUri = `s3://${res.bucket}/`;
  this.register(bucketUri, AwsCredentials.fsFromRole(cfg.roleArn, cfg.externalId));
};

const s3Fs = new FsAwsS3(new S3());
fsa.register('s3://', s3Fs);

const bucketProviderConfig = Env.get(Env.AwsRoleConfigPath);
if (bucketProviderConfig != null) {
  const provider = new FsAwsS3ProviderV2(bucketProviderConfig, fsa);
  provider.onFileSystemCreated = (ro: CredentialSource, fs: FileSystem): void => {
    LogConfig.get().debug({ roleArn: ro.roleArn, prefix: ro.prefix }, 'FileSystem:Registered');
    fsa.register(ro.prefix, fs);
  };
  s3Fs.credentials = provider;
}

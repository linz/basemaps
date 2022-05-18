import { AwsCredentials } from '@chunkd/source-aws-v2';
import { fsa } from '@chunkd/fs';
import { Env } from '@basemaps/shared';

export interface RoleConfig {
  bucket: string;
  accountId: string;
  roleArn: string;
  externalId?: string;
  roleSessionDuration?: number;
}

interface BucketConfig {
  v: number;
  buckets: RoleConfig[];
  version: string;
  package: string;
  hash: string;
  updatedAt: string;
}

export class RoleRegister {
  /** Get all imagery source aws roles */
  static async _loadRoles(): Promise<RoleConfig[]> {
    const configBucket = Env.get(Env.AwsRoleConfigBucket);
    if (configBucket == null) return [];
    const configPath = `s3://${configBucket}/config.json`;
    const config: BucketConfig = await fsa.readJson(configPath);
    const roles = [];
    for (const role of config.buckets) {
      fsa.register(
        's3://' + role.bucket,
        AwsCredentials.fsFromRole(role.roleArn, role.externalId, role.roleSessionDuration),
      );
      roles.push(role);
    }
    return roles;
  }

  static _loadRolesPromise: Promise<RoleConfig[]> | undefined;
  static loadRoles(): Promise<RoleConfig[]> {
    if (RoleRegister._loadRolesPromise == null) RoleRegister._loadRolesPromise = this._loadRoles();
    return RoleRegister._loadRolesPromise;
  }

  static async findRole(path: string): Promise<RoleConfig | undefined> {
    const roles = await this.loadRoles();
    return roles.find((f) => path.startsWith(`s3://${f.bucket}`));
  }
}

/** Search for the imagery across all of our buckets */
export async function findImagery(path: string): Promise<{ files: string[]; totalSize: number }> {
  const files: string[] = [];
  let totalSize = 0;
  for await (const key of fsa.details(path)) {
    console.log(key);
    const searchKey = key.path.toLowerCase();
    if (searchKey.endsWith('.tif') || searchKey.endsWith('.tiff')) {
      files.push(key.path);
      if (key.size != null) totalSize += key.size;
    }
  }
  return { files, totalSize };
}

import { Env } from '../const.js';
import { fsa } from '@chunkd/fs';
import { AwsCredentials } from '@chunkd/source-aws-v2';

export interface RoleConfig {
  bucket: string;
  accountId: string;
  roleArn: string;
  externalId?: string;
  roleSessionDuration?: number;
}

export interface BucketConfig {
  v: number;
  buckets: RoleConfig[];
  version: string;
  package: string;
  hash: string;
  updatedAt: string;
}
function isForbidden(e: unknown): boolean {
  if (typeof e !== 'object') return false;
  if (e == null) return false;
  return (e as { code: unknown }).code === 403;
}

/** Attempt to list the target path, if it fails with a 403 Forbidden assume we do not have permission to do read it */
export async function canRead(path: string): Promise<boolean> {
  try {
    await fsa.list(path).next();
    return true;
  } catch (e: unknown) {
    // Permission denied
    if (isForbidden(e)) return false;
    // Un related error
    throw e;
  }
}

export class RoleRegister {
  /** Get all imagery source aws roles */
  static async _loadRoles(): Promise<RoleConfig[]> {
    const configBucket = Env.get(Env.AwsRoleConfigBucket);
    if (configBucket == null) return [];
    const configPath = `s3://${configBucket}/config.json`;
    const config: BucketConfig = await fsa.readJson(configPath);
    return config.buckets;
  }

  static _loadRolesPromise: Promise<RoleConfig[]> | undefined;
  static loadRoles(): Promise<RoleConfig[]> {
    if (RoleRegister._loadRolesPromise == null) RoleRegister._loadRolesPromise = this._loadRoles();
    return RoleRegister._loadRolesPromise;
  }

  static async findRole(path: string): Promise<RoleConfig | undefined> {
    const isAbleToRead = await canRead(path);
    // If we can directly read/write this path we don't need to register a role for it
    if (isAbleToRead) return;

    const roles = await this.loadRoles();
    const targetRole = roles.find((f) => path.startsWith(`s3://${f.bucket}`));
    if (targetRole == null) throw new Error(`Failed to read ${path}`);

    fsa.register(
      `s3://${targetRole.bucket}`,
      AwsCredentials.fsFromRole(targetRole.roleArn, targetRole.externalId, targetRole.roleSessionDuration),
    );
    return targetRole;
  }
}

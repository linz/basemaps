import { FsAwsS3 } from '@chunkd/source-aws';
import { AwsCredentials } from '@chunkd/source-aws-v2';
import { fsa } from '@chunkd/fs';
import { Env } from '@basemaps/shared';

type RoleConfig = {
  bucket: string;
  accountId: string;
  roleArn: string;
  externalId?: string;
};

type BucketConfig = {
  v: number;
  buckets: RoleConfig[];
  version: string;
  package: string;
  hash: string;
  updatedAt: string;
};

export class AwsRole {
  role: RoleConfig;
  config: AwsRole;
  constructor(role: RoleConfig) {
    this.role = role;
  }

  get s3(): FsAwsS3 {
    return AwsCredentials.fsFromRole(this.role.roleArn, this.role.externalId, 3600);
  }
}

/** Get all imagery source aws roles */
export async function prepareRoles(): Promise<AwsRole[]> {
  const configPath = `s3://${Env.AwsRoleConfigBucket}/config.json`;
  const config: BucketConfig = await fsa.readJson(configPath);
  const roles: AwsRole[] = [];
  for (const role of config.buckets) {
    roles.push(new AwsRole(role));
  }
  return roles;
}

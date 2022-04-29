import { AwsRole, prepareRoles } from './aws.js';

export interface Source {
  uri: string;
  config: AwsRole;
}

/** Search for the imagery across all of our buckets */
export async function findImagery(path: string): Promise<Source | undefined> {
  const roles = await prepareRoles();
  const role = roles.find((f) => path.startsWith(`s3://${f.role.bucket}`));
  if (role == null) return undefined;
  return { uri: path, config: role };
}

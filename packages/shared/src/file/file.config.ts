export type FileConfigPath = FileConfig & FileConfigWithPaths;

export interface FileConfigWithPaths {
  /** absolute path to all files referenced */
  files: string[];
}

export function isFileConfigPath(r: unknown): r is FileConfigPath {
  return Array.isArray((r as Record<string, unknown>)['files']);
}

export type FileConfig = FileConfigLocal | FileConfigS3 | FileConfigS3Role;

export interface FileConfigLocal {
  /** Absolute folder or file path */
  path: string;
  type: 'local';
}

export interface FileConfigS3 {
  /**
   * absolute s3 uri
   * @example s3://foo/bar
   */
  path: string;
  type: 's3';
}

export interface FileConfigS3Role extends FileConfigS3 {
  /** AWS Role ARN to use to access the related S3 Bucket */
  roleArn: string;
  /** Optional AWS externalId if needed */
  externalId?: string;
}

export function isConfigS3Role(r?: string | FileConfig): r is FileConfigS3Role {
  if (r == null) return false;
  if (typeof r === 'string') return false;
  return 'roleArn' in r && typeof r.roleArn === 'string';
}

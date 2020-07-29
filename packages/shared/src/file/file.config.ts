export type FileConfig = FileConfigLocal | FileConfigS3 | FileConfigS3Role;
export type FileConfigPath = FileConfig & FileConfigWithPaths;

export interface FileConfigWithPaths {
    /** absolute path to all files referenced */
    files: string[];
}

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

export function isConfigS3Role(r: any): r is FileConfigS3Role {
    return typeof r['roleArn'] == 'string';
}

export function isFileConfigPath(r: any): r is FileConfigPath {
    return Array.isArray(r['paths']);
}

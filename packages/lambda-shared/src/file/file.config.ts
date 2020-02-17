export type FileConfig = FileConfigLocal | FileConfigS3 | FileConfigS3Role;
export interface FileConfigLocal {
    path: string;
    type: 'local';
}

export interface FileConfigS3 {
    path: string;
    type: 's3';
}

export interface FileConfigS3Role extends FileConfigS3 {
    roleArn: string;
    externalId: string;
}

export function isConfigS3Role(r: any): r is FileConfigS3Role {
    return typeof r['roleArn'] == 'string' && typeof r['externalId'] == 'string';
}

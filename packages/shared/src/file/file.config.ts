import { FileConfig } from '@linzjs/s3fs';
export type FileConfigPath = FileConfig & FileConfigWithPaths;

export interface FileConfigWithPaths {
    /** absolute path to all files referenced */
    files: string[];
}

export function isFileConfigPath(r: any): r is FileConfigPath {
    return Array.isArray(r['files']);
}

import { LogType } from '../log';
import { StsAssumeRoleConfig } from '../aws/credentials';
import { Readable } from 'stream';
import { FileConfig } from './file.config';
import { FileOperatorSimple } from './file.local';
import { FileOperatorS3 } from './file.s3';

export interface FileProcessor {
    read(filePath: string): Promise<Buffer>;
    readJson<T = any>(filePath: string): Promise<T>;
    readStream(filePath: string): Readable;
    write(filePath: string, buffer: Buffer | Readable, logger?: LogType): Promise<void>;
    writeJson(filePath: string, obj: any, logger?: LogType): Promise<void>;
    list(filePath: string): Promise<string[]>;
    exists(filePath: string): Promise<boolean>;
}

/** Simple wrapper to allow both s3:// and local files to be read and listed */
export const FileOperator = {
    /** path.join removes slashes, s3:// => s3:/ which causes issues */
    join(filePathA: string, filePathB: string): string {
        return filePathA.replace(/\/$/, '') + '/' + filePathB.replace(/^\//, '');
    },

    isS3(filePath?: string): boolean {
        if (filePath == null) {
            return false;
        }
        return filePath.startsWith('s3://');
    },

    create(cfg: string | FileConfig): FileProcessor {
        if (typeof cfg == 'string') {
            if (FileOperator.isS3(cfg)) {
                return new FileOperatorS3();
            }
            return FileOperatorSimple;
        }
        if (cfg.type == 's3') {
            if ('roleArn' in cfg) {
                return new FileOperatorS3(cfg as StsAssumeRoleConfig);
            }
            return new FileOperatorS3();
        }
        return FileOperatorSimple;
    },
};

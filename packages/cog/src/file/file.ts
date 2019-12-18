import { Readable } from 'stream';
import { FileOperatorSimple } from './file.local';
import { FileOperatorS3 } from './file.s3';
import { LogType } from '@basemaps/shared';

export interface FileProcessor {
    read(filePath: string): Promise<Buffer>;
    readStream(filePath: string): Readable;
    write(filePath: string, buffer: Buffer | Readable, logger?: LogType): Promise<void>;
    list(filePath: string): Promise<string[]>;
    exists(filePath: string): Promise<boolean>;
}

/** Simple wrapper to allow both s3:// and local files to be read and listed */
export const FileOperator = {
    /** path.join removes slashes, s3:// => s3:/ which causes issues */
    join(filePathA: string, filePathB: string): string {
        return filePathA.replace(/\/$/, '') + '/' + filePathB.replace(/^\//, '');
    },

    isS3(filePath: string): boolean {
        return filePath.startsWith('s3://');
    },

    get(filePath: string): FileProcessor {
        if (FileOperator.isS3(filePath)) {
            return FileOperatorS3;
        }
        return FileOperatorSimple;
    },

    /**
     * Copy a file from one location to another
     * @param sourcePath
     * @param targetPath
     * @param logger Optional logger to log progress
     */
    async copy(sourcePath: string, targetPath: string, logger?: LogType): Promise<void> {
        const data = this.get(sourcePath).readStream(sourcePath);
        await this.get(targetPath).write(targetPath, data, logger);
    },
};

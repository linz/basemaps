import { S3 } from 'aws-sdk';
import { Readable } from 'stream';
import { FileProcessor } from './file';
import { FileConfig, FileConfigS3 } from './file.config';
import { FileOperatorLocal } from './file.local';
import { FileProcessorS3 } from './file.s3';

export * from './file.config';
export * from './file';

export class S3Fs {
    getS3: (cfg: FileConfigS3 | string) => S3;
    constructor(cfg?: { getS3: (cfg: FileConfigS3 | string) => S3 }) {
        if (cfg) {
            this.getS3 = cfg?.getS3;
        } else {
            const s3 = new S3();
            this.getS3 = (): S3 => s3;
        }
    }

    read(filePath: string): Promise<Buffer> {
        return this.create(filePath).read(filePath);
    }

    readStream(filePath: string): Readable {
        return this.create(filePath).readStream(filePath);
    }

    write(filePath: string, buffer: Buffer | Readable): Promise<void> {
        return this.create(filePath).write(filePath, buffer);
    }

    list(filePath: string): Promise<string[]> {
        return this.create(filePath).list(filePath);
    }

    exists(filePath: string): Promise<boolean> {
        return this.create(filePath).exists(filePath);
    }

    /** path.join removes slashes, s3:// => s3:/ which causes issues */
    join(filePathA: string, filePathB: string): string {
        return filePathA.replace(/\/$/, '') + '/' + filePathB.replace(/^\//, '');
    }

    /** Is this FileProcessor a s3 instance */
    isS3Processor(fo: FileProcessor): fo is FileProcessorS3 {
        return fo instanceof FileProcessorS3;
    }

    /** Is this a s3 URI */
    isS3(filePath?: string): boolean {
        if (filePath == null) return false;
        return filePath.startsWith('s3://');
    }

    /** Create an accessor for a given config or path */
    create(cfg: string | FileConfig): FileProcessor {
        if (typeof cfg == 'string') {
            if (this.isS3(cfg)) {
                return new FileProcessorS3(this.getS3(cfg));
            }
            return FileOperatorLocal;
        }
        if (cfg.type == 's3') {
            return new FileProcessorS3(this.getS3(cfg));
        }
        return FileOperatorLocal;
    }
}

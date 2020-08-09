import { S3 } from 'aws-sdk';
import { Readable } from 'stream';
import { FileProcessor } from './file';
import { FileConfig, FileConfigS3 } from './file.config';
import { FsLocal } from './file.local';
import { FsS3 } from './file.s3';
import { CompositeError } from './composite.error';

export * from './file.config';
export * from './file';
export { CompositeError } from './composite.error';

const localFs = new FsLocal();

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
    isS3Processor(fo: FileProcessor): fo is FsS3 {
        return fo instanceof FsS3;
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
                return new FsS3(this.getS3(cfg));
            }
            return localFs;
        }
        if (cfg.type == 's3') {
            return new FsS3(this.getS3(cfg));
        }
        return localFs;
    }

    isCompositeError(e: unknown): e is CompositeError {
        return CompositeError.isCompositeError(e);
    }
}

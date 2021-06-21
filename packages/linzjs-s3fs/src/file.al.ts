import { Readable } from 'stream';
import { CompositeError } from './composite.error';
import { FileInfo, FileSystem } from './file';
import { FsLocal } from './file.local';
import { FsS3 } from './file.s3';

const fsLocal = new FsLocal();
export class FileSystemAbstraction {
    private systems: { path: string; system: FileSystem }[] = [{ path: '/', system: fsLocal }];

    register(path: string, system: FileSystem): void {
        for (const proc of this.systems) {
            if (proc.path.startsWith(path)) throw new Error(`Duplicate processor path: ${path}`);
        }
        this.systems.push({ path, system });
    }

    /** Utility to convert async generators into arrays */
    async toArray<T>(generator: AsyncGenerator<T>): Promise<T[]> {
        const output: T[] = [];
        for await (const o of generator) output.push(o);
        return output;
    }

    read(filePath: string): Promise<Buffer> {
        return this.find(filePath).read(filePath);
    }

    readStream(filePath: string): Readable {
        return this.find(filePath).readStream(filePath);
    }

    write(filePath: string, buffer: Buffer | Readable): Promise<void> {
        return this.find(filePath).write(filePath, buffer);
    }

    list(filePath: string): AsyncGenerator<string> {
        return this.find(filePath).list(filePath);
    }
    listDetails(filePath: string): AsyncGenerator<FileInfo> {
        return this.find(filePath).listDetails(filePath);
    }

    exists(filePath: string): Promise<boolean> {
        return this.find(filePath).exists(filePath);
    }

    head(filePath: string): Promise<FileInfo | null> {
        return this.find(filePath).head(filePath);
    }

    /** path.join removes slashes, s3:// => s3:/ which causes issues */
    join(filePathA: string, filePathB: string): string {
        return filePathA.replace(/\/$/, '') + '/' + filePathB.replace(/^\//, '');
    }

    /** Is this FileProcessor a s3 instance */
    isS3Processor(fo: FileSystem): fo is FsS3 {
        return fo instanceof FsS3;
    }

    /** Is this a s3 URI */
    isS3(filePath?: string): boolean {
        if (filePath == null) return false;
        return filePath.startsWith('s3://');
    }

    /** Find the filesystem that would be used for a given path */
    find(filePath: string): FileSystem {
        for (const cfg of this.systems) {
            if (filePath.startsWith(cfg.path)) return cfg.system;
        }

        return fsLocal;
    }

    isCompositeError(e: unknown): e is CompositeError {
        return CompositeError.isCompositeError(e);
    }
}

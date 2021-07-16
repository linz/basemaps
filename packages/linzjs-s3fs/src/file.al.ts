import { Readable } from 'stream';
import { CompositeError } from './composite.error';
import { FileInfo, FileSystem } from './file';
import { FsLocal } from './abstractions/file.local';
import { FsS3 } from './abstractions/file.s3';

const fsLocal = new FsLocal();
export class FileSystemAbstraction {
    /**
     * Is the systems array currently ordered
     * @see FileSystemAbstraction.sortSystems
     */
    private isOrdered = true;
    private systems: { path: string; system: FileSystem }[] = [{ path: '/', system: fsLocal }];

    /**
     * Register a file system to a specific path which can then be used with any `fsa` command
     *
     * @example
     * fsa.register('s3://', fsS3)
     * fsa.register('s3://bucket-a/key-a', specificS3)
     * fsa.register('http://', fsHttp)
     *
     */
    register(path: string, system: FileSystem): void {
        this.systems.push({ path, system });
        this.isOrdered = false;
    }

    /** Utility to convert async generators into arrays */
    async toArray<T>(generator: AsyncGenerator<T>): Promise<T[]> {
        const output: T[] = [];
        for await (const o of generator) output.push(o);
        return output;
    }

    /**
     * Read a file into memory
     *
     * @param filePath file to read
     * @returns Content of the file
     */
    read(filePath: string): Promise<Buffer> {
        return this.find(filePath).read(filePath);
    }

    /**
     * Create a read stream for a file
     *
     * @param filePath file to read
     * @returns Stream of file contents
     */
    readStream(filePath: string): Readable {
        return this.find(filePath).readStream(filePath);
    }

    /**
     * Write a file to a location
     *
     * @param filePath file to write
     * @param buffer buffer or stream to write
     */
    write(filePath: string, buffer: Buffer | Readable): Promise<void> {
        return this.find(filePath).write(filePath, buffer);
    }

    /**
     * List recursively all files starting with the filePath
     * @param filePath file path to search
     * @returns list of files inside that path
     */
    list(filePath: string): AsyncGenerator<string> {
        return this.find(filePath).list(filePath);
    }

    /**
     * List recursively all files starting with the filePath with basic
     * file information such as size
     *
     * @param filePath file path to search
     * @returns list of files inside that path
     */
    listDetails(filePath: string): AsyncGenerator<FileInfo> {
        return this.find(filePath).listDetails(filePath);
    }

    /**
     * Does this object exist
     *
     * @param filePath path to check
     * @returns true if file exists, false otherwise
     */
    exists(filePath: string): Promise<boolean> {
        return this.find(filePath).exists(filePath);
    }

    /**
     * Fetch basic information about the file
     *
     * @param filePath path to check
     * @returns basic information such as file size
     */
    head(filePath: string): Promise<FileInfo | null> {
        return this.find(filePath).head(filePath);
    }

    /** path.join removes slashes, s3:// => s3:/ which causes issues */
    join(filePathA: string, filePathB: string): string {
        return filePathA.replace(/\/$/, '') + '/' + filePathB.replace(/^\//, '');
    }

    /** Is this FileProcessor a s3 instance */
    isS3Processor(fs: FileSystem): fs is FsS3 {
        return FsS3.is(fs);
    }

    /** Is this a s3 URI */
    isS3(filePath?: string): boolean {
        return FsS3.isPath(filePath);
    }

    /**
     * Sort the file systems based on the length of the prefix
     * forcing more specific prefixes to be first and matched first
     */
    private sortSystems(): void {
        if (this.isOrdered) return;
        // TODO a priority order would also be nice to override this sorting.
        this.systems.sort((a, b) => b.path.length - a.path.length);
        this.isOrdered = true;
    }

    /** Find the filesystem that would be used for a given path */
    find(filePath: string): FileSystem {
        this.sortSystems();
        for (const cfg of this.systems) if (filePath.startsWith(cfg.path)) return cfg.system;

        // TODO this is for backwards compatibility and also handles the case of `fsa.read('foo.json')
        // to read from the current folder
        return fsLocal;
    }

    isCompositeError(e: unknown): e is CompositeError {
        return CompositeError.isCompositeError(e);
    }
}

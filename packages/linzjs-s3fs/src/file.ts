import type { Readable } from 'stream';

export interface FileInfo {
    /** Size of file in bytes */
    size: number;
}

export interface FileProcessor {
    /** Read a file into a buffer */
    read(filePath: string): Promise<Buffer>;
    /** Create a read stream */
    readStream(filePath: string): Readable;
    /** Write a file from either a buffer or stream */
    write(filePath: string, buffer: Buffer | Readable): Promise<void>;
    /** List all files in path */
    list(filePath: string): AsyncGenerator<string>;
    /** Does the path exists */
    exists(filePath: string): Promise<boolean>;
    /** Get information about the path  */
    head(filePath: string): Promise<FileInfo | null>;
}

import type { Readable } from 'stream';

export interface FileInfo {
    /** file path */
    path: string;
    /**
     * Size of file in bytes
     * undefined if no size found
     */
    size?: number;
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
    /** List all files in path with additional details */
    listDetails(filePath: string): AsyncGenerator<FileInfo>;
    /** Does the path exists */
    exists(filePath: string): Promise<boolean>;
    /** Get information about the path  */
    head(filePath: string): Promise<FileInfo | null>;
}

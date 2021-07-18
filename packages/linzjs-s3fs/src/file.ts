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

export interface FileSystem {
    /**
     * Protocol used for communication
     * @example
     * file
     * s3
     * http
     */
    protocol: string;
    /** Read a file into a buffer */
    read(filePath: string): Promise<Buffer>;
    /** Create a read stream */
    readStream(filePath: string): Readable;
    /** Write a file from either a buffer or stream */
    write(filePath: string, buffer: Buffer | Readable): Promise<void>;
    /** Recursively list all files in path */
    list(filePath: string): AsyncGenerator<string>;
    /** Recursively list all files in path with additional details */
    listDetails(filePath: string): AsyncGenerator<FileInfo>;
    /** Does the path exists */
    exists(filePath: string): Promise<boolean>;
    /** Get information about the path  */
    head(filePath: string): Promise<FileInfo | null>;
}

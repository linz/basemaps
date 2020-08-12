import { Readable } from 'stream';

export interface FileProcessor {
    /** Read a file into a buffer */
    read(filePath: string): Promise<Buffer>;
    /** Create a read stream */
    readStream(filePath: string): Readable;
    /** Write a file from either a buffer or stream */
    write(filePath: string, buffer: Buffer | Readable): Promise<void>;
    /** List all files in path */
    list(filePath: string): Promise<string[]>;
    /** Does the path exists */
    exists(filePath: string): Promise<boolean>;
}

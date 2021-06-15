import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { FileInfo, FileProcessor } from './file';
import { CompositeError } from './composite.error';

export type FsError = { code: string } & Error;
function getCompositeError(e: FsError, msg: string): CompositeError {
    if (e.code === 'ENOENT') return new CompositeError(msg, 404, e);
    if (e.code === 'EACCES') return new CompositeError(msg, 403, e);
    return new CompositeError(msg, 500, e);
}

export class FsLocal implements FileProcessor {
    async *list(filePath: string): AsyncGenerator<string> {
        try {
            const files = await fs.promises.readdir(filePath);
            for (const file of files) yield path.join(filePath, file);
        } catch (e) {
            throw getCompositeError(e, `Failed to list: ${filePath}`);
        }
    }

    async head(filePath: string): Promise<FileInfo | null> {
        try {
            const stat = await fs.promises.stat(filePath);
            return { size: stat.size };
        } catch (e) {
            if (e.code === 'ENOENT') return null;
            throw getCompositeError(e, `Failed to stat: ${filePath}`);
        }
    }

    async read(filePath: string): Promise<Buffer> {
        try {
            return await fs.promises.readFile(filePath);
        } catch (e) {
            throw getCompositeError(e, `Failed to read: ${filePath}`);
        }
    }

    exists(filePath: string): Promise<boolean> {
        return this.head(filePath).then((f) => f != null);
    }

    async write(filePath: string, buf: Buffer | Readable, makeFolder = true): Promise<void> {
        const folderPath = path.dirname(filePath);
        if (makeFolder) await fs.promises.mkdir(folderPath, { recursive: true });
        try {
            if (Buffer.isBuffer(buf)) {
                await fs.promises.writeFile(filePath, buf);
            } else {
                const st = fs.createWriteStream(filePath);
                await new Promise((resolve, reject) => {
                    st.on('finish', resolve);
                    st.on('error', reject);
                    buf.pipe(st);
                });
            }
        } catch (e) {
            throw getCompositeError(e, `Failed to write: ${filePath}`);
        }
    }

    readStream(filePath: string): fs.ReadStream {
        return fs.createReadStream(filePath);
    }
}

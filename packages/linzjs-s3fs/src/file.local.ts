import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { FileProcessor } from './file';

export const FileOperatorLocal: FileProcessor = {
    async list(filePath: string): Promise<string[]> {
        const files = await fs.promises.readdir(filePath);
        return files.map((f: string): string => path.join(filePath, f));
    },

    async read(filePath: string): Promise<Buffer> {
        return fs.promises.readFile(filePath);
    },

    async exists(filePath: string): Promise<boolean> {
        return await new Promise((resolve) => {
            fs.exists(filePath, resolve);
        });
    },

    async write(filePath: string, buf: Buffer | Readable): Promise<void> {
        const folderPath = path.dirname(filePath);
        await fs.promises.mkdir(folderPath, { recursive: true });

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
    },

    readStream(filePath: string): fs.ReadStream {
        return fs.createReadStream(filePath);
    },
};

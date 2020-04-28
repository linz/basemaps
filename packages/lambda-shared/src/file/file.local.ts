import * as fs from 'fs';
import * as path from 'path';
import { FileProcessor } from './file';
import { Readable } from 'stream';

export const FileOperatorSimple: FileProcessor = {
    async list(filePath: string): Promise<string[]> {
        const files = await fs.promises.readdir(filePath);
        return files.map((f: string): string => path.join(filePath, f));
    },
    async read(filePath: string): Promise<Buffer> {
        return fs.promises.readFile(filePath);
    },

    async readJson(filePath: string): Promise<any> {
        return JSON.parse((await this.read(filePath)).toString());
    },

    async exists(filePath: string): Promise<boolean> {
        return fs.existsSync(filePath);
    },
    async write(filePath: string, buf: Buffer | Readable): Promise<void> {
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
    writeJson(filePath: string, obj: any): Promise<void> {
        return this.write(filePath, Buffer.from(JSON.stringify(obj, undefined, 2)));
    },
    readStream(filePath: string): fs.ReadStream {
        return fs.createReadStream(filePath);
    },
};

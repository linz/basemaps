import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { promisify } from 'util';
import { createGzip, gunzip } from 'zlib';
import { FileProcessor } from './file';

const pGunzip = promisify(gunzip) as (data: Buffer) => Promise<Buffer>;

export const FileOperatorSimple: FileProcessor = {
    async list(filePath: string): Promise<string[]> {
        const files = await fs.promises.readdir(filePath);
        return files.map((f: string): string => path.join(filePath, f));
    },

    async read(filePath: string): Promise<Buffer> {
        return fs.promises.readFile(filePath);
    },

    async readJson<T>(filePath: string): Promise<T> {
        const data = await this.read(filePath);
        if (path.extname(filePath) === '.gz') {
            return JSON.parse((await pGunzip(data)).toString()) as T;
        } else {
            return JSON.parse(data.toString()) as T;
        }
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
        const json = Buffer.from(JSON.stringify(obj, undefined, 2));
        if (path.extname(filePath) === '.gz') {
            const gzip = createGzip();
            gzip.end(json);
            return this.write(filePath, gzip);
        } else {
            return this.write(filePath, json);
        }
    },

    readStream(filePath: string): fs.ReadStream {
        return fs.createReadStream(filePath);
    },
};

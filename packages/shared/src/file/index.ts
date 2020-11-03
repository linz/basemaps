export * from './file.config';
export * from '@linzjs/s3fs';

import { promisify } from 'util';
import { createGzip, gunzip } from 'zlib';
import { S3Fs, isConfigS3Role, FileConfigS3, FileProcessor } from '@linzjs/s3fs';
import { Aws } from '../aws';
import type S3 from 'aws-sdk/clients/s3';

function getS3(s3Cfg: string | FileConfigS3): S3 {
    if (isConfigS3Role(s3Cfg)) {
        return Aws.credentials.getS3ForRole(s3Cfg);
    }

    return Aws.credentials.getS3ForRole();
}

const pGunzip = promisify(gunzip) as (data: Buffer) => Promise<Buffer>;

export class S3FsJson extends S3Fs {
    async readJson<T>(filePath: string, f: FileProcessor = this): Promise<T> {
        const data = await f.read(filePath);
        if (filePath.endsWith('.gz')) {
            return JSON.parse((await pGunzip(data)).toString()) as T;
        } else {
            return JSON.parse(data.toString()) as T;
        }
    }
    async writeJson(filePath: string, obj: any, f: FileProcessor = this): Promise<void> {
        const json = Buffer.from(JSON.stringify(obj, undefined, 2));
        if (filePath.endsWith('.gz')) {
            const gzip = createGzip();
            gzip.end(json);
            return f.write(filePath, gzip);
        } else {
            return f.write(filePath, json);
        }
    }
}

export const FileOperator = new S3FsJson({ getS3 });

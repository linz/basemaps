import { S3 } from 'aws-sdk';
import * as path from 'path';
import { Readable, Stream } from 'stream';
import { promisify } from 'util';
import { createGzip, gunzip } from 'zlib';
import { Aws } from '../aws';
import { StsAssumeRoleConfig } from '../aws/credentials';
import { LogType } from '../log';
import { FileProcessor } from './file';

const pGunzip = promisify(gunzip) as (data: Buffer) => Promise<Buffer>;

const MaxListCount = 100;
export class FileOperatorS3 implements FileProcessor {
    s3: S3;
    static isS3(obj: any): obj is FileOperatorS3 {
        return obj instanceof FileOperatorS3;
    }
    constructor(options?: StsAssumeRoleConfig) {
        this.s3 = Aws.credentials.getS3ForRole(options);
    }

    static parse(uri: string): { bucket: string; key: string } {
        const parts = uri.split('/');
        const bucket = parts[2];
        if (bucket == null || bucket.trim() == '') {
            throw new Error(`Unable to parse s3 uri: ${uri}`);
        }
        const key = parts.slice(3).join('/');
        if (key == null || key.trim() == '') {
            throw new Error(`Unable to parse s3 uri: ${uri}`);
        }
        return { key, bucket };
    }

    async list(filePath: string): Promise<string[]> {
        const opts = FileOperatorS3.parse(filePath);
        let list: S3.Types.ObjectList = [];
        let ContinuationToken: string | undefined = undefined;
        const Bucket = opts.bucket;
        const Prefix = opts.key;

        let count = 0;

        while (true) {
            count++;
            const res: S3.Types.ListObjectsV2Output = await this.s3
                .listObjectsV2({ Bucket, Prefix, ContinuationToken })
                .promise();

            // Failed to get any content abort
            if (res.Contents == null) {
                break;
            }
            list = list.concat(res.Contents);

            // Nothing left to fetch
            if (!res.IsTruncated) {
                break;
            }

            // Abort if too many lists
            if (count > MaxListCount) {
                throw new Error(`Failed to finish listing within ${MaxListCount} list attempts`);
            }
            ContinuationToken = res.NextContinuationToken;
        }

        return list.map((c) => `s3://${Bucket}/${c.Key}`);
    }

    async read(filePath: string): Promise<Buffer> {
        const opts = FileOperatorS3.parse(filePath);

        const res = await this.s3.getObject({ Bucket: opts.bucket, Key: opts.key }).promise();
        return res.Body as Buffer;
    }

    async readJson(filePath: string): Promise<any> {
        const data = await this.read(filePath);
        if (path.extname(filePath) === '.gz') {
            return JSON.parse((await pGunzip(data)).toString());
        } else {
            return JSON.parse(data.toString());
        }
    }

    async write(filePath: string, buf: Buffer | Stream, logger?: LogType): Promise<void> {
        const opts = FileOperatorS3.parse(filePath);
        await this.s3
            .upload({ Bucket: opts.bucket, Key: opts.key, Body: buf })
            .on('httpUploadProgress', (evt) => {
                const progress = parseFloat(((evt.loaded / evt.total) * 100).toFixed(2));
                logger?.debug({ progress, size: evt.total, ...opts }, 'UploadProgress');
            })
            .promise();
    }

    writeJson(filePath: string, obj: any, logger?: LogType): Promise<void> {
        const json = Buffer.from(JSON.stringify(obj, undefined, 2));
        if (path.extname(filePath) === '.gz') {
            const gzip = createGzip();
            gzip.end(json);
            return this.write(filePath, gzip, logger);
        } else {
            return this.write(filePath, json, logger);
        }
    }

    async exists(filePath: string): Promise<boolean> {
        const opts = FileOperatorS3.parse(filePath);
        try {
            await this.s3.headObject({ Bucket: opts.bucket, Key: opts.key }).promise();
            return true;
        } catch (e) {
            if (e.code == 'NotFound') {
                return false;
            }
            throw e;
        }
    }

    readStream(filePath: string): Readable {
        const opts = FileOperatorS3.parse(filePath);
        return this.s3.getObject({ Bucket: opts.bucket, Key: opts.key }).createReadStream();
    }
}

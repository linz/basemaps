import { Aws, LogType } from '@basemaps/shared';
import { S3 } from 'aws-sdk';
import { Stream, Readable } from 'stream';

const s3 = new Aws.sdk.S3();

const MaxListCount = 100;
export const FileOperatorS3 = {
    parse(uri: string): { bucket: string; key: string } {
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
    },

    async list(filePath: string): Promise<string[]> {
        const opts = FileOperatorS3.parse(filePath);
        let list: S3.Types.ObjectList = [];
        let ContinuationToken: string | undefined = undefined;
        const Bucket = opts.bucket;
        const Prefix = opts.key;

        let count = 0;

        while (true) {
            count++;
            const res: S3.Types.ListObjectsV2Output = await s3
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

        return list.map(c => `s3://${Bucket}/${c.Key}`);
    },

    async read(filePath: string): Promise<Buffer> {
        const opts = FileOperatorS3.parse(filePath);

        const res = await s3.getObject({ Bucket: opts.bucket, Key: opts.key }).promise();
        return res.Body as Buffer;
    },

    async write(filePath: string, buf: Buffer | Stream, logger?: LogType): Promise<void> {
        const opts = FileOperatorS3.parse(filePath);
        await s3
            .upload({ Bucket: opts.bucket, Key: opts.key, Body: buf })
            .on('httpUploadProgress', evt => {
                const progress = ((evt.loaded / evt.total) * 100).toFixed(2);
                logger?.debug({ progress, size: evt.total, ...opts }, 'UploadProgress');
            })
            .promise();
    },

    async exists(): Promise<boolean> {
        // TODO does heading a missing object error
        // const opts = FileOperatorS3.parse(filePath);
        // await s3.headObject({ Bucket: opts.bucket, Key: opts.key }).promise();
        throw new Error('Not yet implemented');
    },

    readStream(filePath: string): Readable {
        const opts = FileOperatorS3.parse(filePath);
        return s3.getObject({ Bucket: opts.bucket, Key: opts.key }).createReadStream();
    },
};

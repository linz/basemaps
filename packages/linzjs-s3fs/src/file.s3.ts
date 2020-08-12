import { S3 } from 'aws-sdk';
import { Readable, Stream } from 'stream';
import { CompositeError } from './composite.error';
import { FileProcessor } from './file';

export class FileProcessorS3 implements FileProcessor {
    /** Max list requests to run before erroring */
    static MaxListCount = 100;

    /** AWS-SDK s3 to use */
    s3: S3;

    constructor(s3: S3) {
        this.s3 = s3;
    }

    /** Parse a s3:// URI into the bucket and key components */
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
    }

    async list(filePath: string): Promise<string[]> {
        const opts = this.parse(filePath);
        let list: S3.Types.ObjectList = [];
        let ContinuationToken: string | undefined = undefined;
        const Bucket = opts.bucket;
        const Prefix = opts.key;

        let count = 0;
        try {
            while (true) {
                count++;
                const res: S3.Types.ListObjectsV2Output = await this.s3
                    .listObjectsV2({ Bucket, Prefix, ContinuationToken })
                    .promise();

                // Failed to get any content abort
                if (res.Contents == null) break;
                list = list.concat(res.Contents);

                // Nothing left to fetch
                if (!res.IsTruncated) break;

                // Abort if too many lists
                if (count > FileProcessorS3.MaxListCount) {
                    throw new Error(`Failed to finish listing within ${FileProcessorS3.MaxListCount} list attempts`);
                }
                ContinuationToken = res.NextContinuationToken;
            }
        } catch (e) {
            throw new CompositeError(`Failed to list: ${filePath}`, e);
        }

        return list.map((c) => `s3://${Bucket}/${c.Key}`);
    }

    async read(filePath: string): Promise<Buffer> {
        const opts = this.parse(filePath);

        try {
            const res = await this.s3.getObject({ Bucket: opts.bucket, Key: opts.key }).promise();
            return res.Body as Buffer;
        } catch (e) {
            throw new CompositeError(`Failed to read: ${filePath}`, e);
        }
    }

    async write(filePath: string, buf: Buffer | Stream): Promise<void> {
        const opts = this.parse(filePath);
        try {
            await this.s3.upload({ Bucket: opts.bucket, Key: opts.key, Body: buf }).promise();
        } catch (e) {
            throw new CompositeError(`Failed to write: ${filePath}`, e);
        }
    }

    async exists(filePath: string): Promise<boolean> {
        const opts = this.parse(filePath);
        try {
            await this.s3.headObject({ Bucket: opts.bucket, Key: opts.key }).promise();
            return true;
        } catch (e) {
            if (e.code == 'NotFound') {
                return false;
            }
            throw new CompositeError(`Failed to exists: ${filePath}`, e);
        }
    }

    readStream(filePath: string): Readable {
        const opts = this.parse(filePath);
        return this.s3.getObject({ Bucket: opts.bucket, Key: opts.key }).createReadStream();
    }
}

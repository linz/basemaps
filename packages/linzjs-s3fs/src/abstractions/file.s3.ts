import S3 from 'aws-sdk/clients/s3';
import { Credentials } from 'aws-sdk/lib/credentials';
import { ChainableTemporaryCredentials } from 'aws-sdk/lib/credentials/chainable_temporary_credentials';
import { EC2MetadataCredentials } from 'aws-sdk/lib/credentials/ec2_metadata_credentials';
import { SharedIniFileCredentials } from 'aws-sdk/lib/credentials/shared_ini_file_credentials';
import type { AWSError } from 'aws-sdk/lib/error';
import type { Readable, Stream } from 'stream';
import { CompositeError } from '../composite.error';
import { FileInfo, FileSystem } from '../file';

function getCompositeError(e: AWSError, msg: string): CompositeError {
    if (typeof e?.statusCode === 'number') return new CompositeError(msg, e.statusCode, e);
    return new CompositeError(msg, 500, e);
}

export class FsS3 implements FileSystem {
    /**
     * Create a aws credential instance from a role arn
     *
     * if the AWS profile is "ec2" use EC2MetadataCredentials, otherwise load credentials from the shared ini file
     */
    static credentialsFromRoleArn(roleArn: string, profile?: string | 'ec2', externalId?: string): Credentials {
        const masterCredentials =
            profile === 'ec2' ? new EC2MetadataCredentials() : new SharedIniFileCredentials({ profile });
        return new ChainableTemporaryCredentials({
            params: {
                RoleArn: roleArn,
                ExternalId: externalId,
                RoleSessionName: 'fsa-' + Math.random().toString(32) + '-' + Date.now(),
            },
            masterCredentials,
        });
    }

    /**
     * Create a FsS3 instance from a role arn
     *
     * if the AWS profile is "ec2" use EC2MetadataCredentials, otherwise load credentials from the shared ini file
     *
     * @example
     * Fs3.fromRoleArn('arn:foo', 'ec2');
     * FsS3.fromRoleArn('arn:bar', process.env.AWS_PROFILE);
     */
    static fromRoleArn(roleArn: string, profile?: string | 'ec2', externalId?: string): FsS3 {
        const credentials = FsS3.credentialsFromRoleArn(roleArn, profile, externalId);
        return new FsS3(new S3({ credentials }));
    }

    static protocol = 's3';
    protocol = FsS3.protocol;
    /** Max list requests to run before erroring */
    static MaxListCount = 100;

    /** AWS-SDK s3 to use */
    s3: S3;

    constructor(s3: S3) {
        this.s3 = s3;
    }

    /** Is this file system a s3 file system */
    static is(fs: FileSystem): fs is FsS3 {
        return fs.protocol === FsS3.protocol;
    }

    /** Is this pat a s3 path */
    static isPath(path?: string): boolean {
        if (path == null) return false;
        return path.startsWith('s3://');
    }

    /** Parse a s3:// URI into the bucket and key components */
    static parse(uri: string): { bucket: string; key?: string } {
        if (!uri.startsWith('s3://')) throw new Error(`Unable to parse s3 uri: "${uri}"`);
        const parts = uri.split('/');
        const bucket = parts[2];
        if (bucket == null || bucket.trim() === '') {
            throw new Error(`Unable to parse s3 uri: "${uri}"`);
        }

        if (parts.length === 3) return { bucket };

        const key = parts.slice(3).join('/');
        if (key == null || key.trim() === '') {
            return { bucket };
        }
        return { key, bucket };
    }
    parse = FsS3.parse;

    async *list(filePath: string): AsyncGenerator<string> {
        for await (const obj of this.listDetails(filePath)) yield obj.path;
    }

    async *listDetails(filePath: string): AsyncGenerator<FileInfo> {
        const opts = this.parse(filePath);
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

                for (const obj of res.Contents) {
                    if (obj.Key == null) continue;
                    yield { path: `s3://${Bucket}/${obj.Key}`, size: obj.Size };
                }

                // Nothing left to fetch
                if (!res.IsTruncated) break;

                // Abort if too many lists
                if (count >= FsS3.MaxListCount) {
                    throw new Error(`Failed to finish listing within ${FsS3.MaxListCount} list attempts`);
                }
                ContinuationToken = res.NextContinuationToken;
            }
        } catch (e) {
            throw getCompositeError(e, `Failed to list: "${filePath}"`);
        }
    }

    async read(filePath: string): Promise<Buffer> {
        const opts = this.parse(filePath);
        if (opts.key == null) throw new Error(`Failed to read:  "${filePath}"`);

        try {
            const res = await this.s3.getObject({ Bucket: opts.bucket, Key: opts.key }).promise();
            return res.Body as Buffer;
        } catch (e) {
            throw getCompositeError(e, `Failed to read: "${filePath}"`);
        }
    }

    async write(filePath: string, buf: Buffer | Stream): Promise<void> {
        const opts = this.parse(filePath);
        if (opts.key == null) throw new Error(`Failed to write: "${filePath}"`);

        try {
            await this.s3.upload({ Bucket: opts.bucket, Key: opts.key, Body: buf }).promise();
        } catch (e) {
            throw getCompositeError(e, `Failed to write: "${filePath}"`);
        }
    }

    exists(filePath: string): Promise<boolean> {
        return this.head(filePath).then((f) => f != null);
    }

    readStream(filePath: string): Readable {
        const opts = this.parse(filePath);
        if (opts.key == null) throw new Error(`S3: Unable to read "${filePath}"`);

        return this.s3.getObject({ Bucket: opts.bucket, Key: opts.key }).createReadStream();
    }

    async head(filePath: string): Promise<FileInfo | null> {
        const opts = this.parse(filePath);
        if (opts.key == null) throw new Error(`Failed to exists: "${filePath}"`);
        try {
            const res = await this.s3.headObject({ Bucket: opts.bucket, Key: opts.key }).promise();
            return { size: res.ContentLength, path: filePath };
        } catch (e) {
            if (e.code === 'NotFound') return null;
            throw getCompositeError(e, `Failed to exists: "${filePath}"`);
        }
    }
}

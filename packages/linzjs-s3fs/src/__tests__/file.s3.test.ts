import { FsS3 } from '../file.s3';
import o from 'ospec';
import S3 from 'aws-sdk/clients/s3';
import { createSandbox } from 'sinon';
import { S3Fs } from '..';

o.spec('file.s3', () => {
    const sandbox = createSandbox();
    const mockS3 = new S3();
    const fs = new FsS3(mockS3);

    const s3fs = new S3Fs();

    o.afterEach(() => sandbox.restore());

    o.spec('parse', () => {
        o('should only parse s3://', () => {
            o(() => fs.parse('https://')).throws(Error);
            o(() => fs.parse('https://google.com')).throws(Error);
            o(() => fs.parse('/home/foo/bar')).throws(Error);
            o(() => fs.parse('c:\\Program Files\\')).throws(Error);
        });

        o('should parse s3 uris', () => {
            o(fs.parse('s3://bucket/key')).deepEquals({ bucket: 'bucket', key: 'key' });
            o(fs.parse('s3://bucket/key/')).deepEquals({ bucket: 'bucket', key: 'key/' });
            o(fs.parse('s3://bucket/key/is/deep.txt')).deepEquals({ bucket: 'bucket', key: 'key/is/deep.txt' });
        });
        o('should parse bucket only uris', () => {
            o(fs.parse('s3://bucket')).deepEquals({ bucket: 'bucket' });
            o(fs.parse('s3://bucket/')).deepEquals({ bucket: 'bucket' });
        });
    });

    o.spec('exists', () => {
        o('should throw if max call count is reached', async () => {
            let callCount = 0;
            const stub = sandbox.stub(mockS3, 'listObjectsV2').returns({
                async promise() {
                    return {
                        Contents: [{ Key: 'File:' + callCount }],
                        IsTruncated: true,
                        NextContinuationToken: callCount++,
                    };
                },
            } as any);
            try {
                await s3fs.toArray(fs.list('s3://bucket'));
                o(true).equals(false)('Should error on invalid reads');
            } catch (e) {
                o(e.message).equals('Failed to list: "s3://bucket"');
                o(e.reason.message).equals('Failed to finish listing within 100 list attempts');
                o(stub.callCount).equals(100);
            }
        });
        o('should allow listing of bucket using multiple requests', async () => {
            let callCount = 0;
            const stub = sandbox.stub(mockS3, 'listObjectsV2').returns({
                async promise() {
                    callCount++;
                    if (callCount == 5) return { Contents: [{ Key: 'FirstFile:' + callCount }], IsTruncated: false };
                    return {
                        Contents: [{ Key: 'FirstFile:' + callCount }],
                        IsTruncated: true,
                        NextContinuationToken: callCount,
                    };
                },
            } as any);

            const data = await s3fs.toArray(fs.list('s3://bucket'));
            o(data).deepEquals([
                's3://bucket/FirstFile:1',
                's3://bucket/FirstFile:2',
                's3://bucket/FirstFile:3',
                's3://bucket/FirstFile:4',
                's3://bucket/FirstFile:5',
            ]);
            o(stub.callCount).equals(5);
            const [firstCall] = stub.args[0] as any;
            o(firstCall).deepEquals({ Bucket: 'bucket', Prefix: undefined, ContinuationToken: undefined });
            const [secondCall] = stub.args[1] as any;
            o(secondCall).deepEquals({ Bucket: 'bucket', Prefix: undefined, ContinuationToken: 1 });
        });

        o('should allow listing of bucket', async () => {
            const stub = sandbox.stub(mockS3, 'listObjectsV2').returns({
                promise() {
                    return { Contents: [{ Key: 'FirstFile' }], IsTruncated: false };
                },
            } as any);

            const data = await s3fs.toArray(fs.list('s3://bucket'));
            o(data).deepEquals(['s3://bucket/FirstFile']);
            o(stub.callCount).equals(1);
            const [firstCall] = stub.args[0] as any;
            o(firstCall).deepEquals({ Bucket: 'bucket', Prefix: undefined, ContinuationToken: undefined });
        });

        o('should allow listing of bucket with prefix', async () => {
            const stub = sandbox.stub(mockS3, 'listObjectsV2').returns({
                promise() {
                    return { Contents: [{ Key: 'keyFirstFile' }], IsTruncated: false };
                },
            } as any);

            const data = await s3fs.toArray(fs.list('s3://bucket/key'));
            o(data).deepEquals(['s3://bucket/keyFirstFile']);
            o(stub.callCount).equals(1);
            const [firstCall] = stub.args[0] as any;
            o(firstCall).deepEquals({ Bucket: 'bucket', Prefix: 'key', ContinuationToken: undefined });
        });
    });

    o.spec('read', () => {
        o('should read a file', async () => {
            const getObjectStub = sandbox.stub(mockS3, 'getObject').returns({
                async promise() {
                    return { Body: Buffer.from('Hello World') };
                },
            } as any);
            const data = await fs.read('s3://bucket/key');

            o(getObjectStub.callCount).equals(1);
            o(getObjectStub.args[0]).deepEquals([{ Bucket: 'bucket', Key: 'key' }] as any);
            o(data.toString()).equals('Hello World');
        });
        o('should error if no key was provided', async () => {
            try {
                await fs.read('s3://bucket');
                o(true).equals(false)('Should error on invalid reads');
            } catch (e) {
                o(e.message.includes('s3://bucket')).equals(true)('Should include s3://bucket');
            }
        });
    });
    o.spec('readStream', () => {
        o('should error if no key was provided', async () => {
            try {
                await fs.readStream('s3://bucket');
                o(true).equals(false)('Should error on invalid reads');
            } catch (e) {
                o(e.message.includes('s3://bucket')).equals(true)('Should include s3://bucket');
            }
        });
    });

    o.spec('write', () => {
        o('should write a file', async () => {
            const stub = sandbox.stub(mockS3, 'upload').returns({
                async promise() {
                    return '';
                },
            } as any);
            await fs.write('s3://bucket/key.txt', Buffer.from('Hello World'));
            o(stub.callCount).equals(1);
            o(stub.args[0][0].Bucket).deepEquals('bucket');
            o(stub.args[0][0].Key).deepEquals('key.txt');
            o(stub.args[0][0].Body?.toString()).deepEquals('Hello World');
        });

        o('should error if no key was provided', async () => {
            try {
                await fs.write('s3://bucket', Buffer.from('Hello World'));
                o(true).equals(false)('Should error on invalid writes');
            } catch (e) {
                o(e.message.includes('s3://bucket')).equals(true)('Should include s3://bucket');
            }
        });
    });

    o.spec('CompositeError', () => {
        o('bad statusCode', async () => {
            const stub = sandbox.stub(mockS3, 'getObject').returns({
                async promise() {
                    throw {};
                },
            } as any);
            try {
                await fs.read('s3://test-bucket/foo.txt');
                o('Should have thrown error').equals('');
            } catch (err) {
                o(err.code).equals(500);
                o(stub.callCount).equals(1);
            }
        });

        o('statusCode', async () => {
            const stub = sandbox.stub(mockS3, 'getObject').returns({
                async promise() {
                    throw { statusCode: 404 };
                },
            } as any);
            try {
                await fs.read('s3://test-bucket/foo.txt');
                o('Should have thrown error').equals('');
            } catch (err) {
                o(err.code).equals(404);
                o(err.reason.statusCode).equals(404);
                o(stub.callCount).equals(1);
            }
        });
    });
});

import { FsS3 } from '../file.s3';
import o from 'ospec';
import { S3 } from 'aws-sdk';

o.spec('file.s3', () => {
    o.spec('CompositeError', () => {
        let err: any = null;
        const mockS3 = {
            getObject(): any {
                return {
                    async promise(): Promise<void> {
                        throw err;
                    },
                };
            },
        } as S3;
        const fs = new FsS3(mockS3);

        o('bad statusCode', async () => {
            err = {};
            try {
                await fs.read('s3://test-bucket/foo.txt');
                o('Should have thrown error').equals('');
            } catch (err) {
                o(err.code).equals(500);
            }
        });

        o('statusCode', async () => {
            err = { statusCode: 404 };
            try {
                await fs.read('s3://test-bucket/foo.txt');
                o('Should have thrown error').equals('');
            } catch (err) {
                o(err.code).equals(404);
                o(err.reason.statusCode).equals(404);
            }
        });
    });
});

import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import s3 = require('@aws-cdk/aws-s3');

import { RetentionDays } from '@aws-cdk/aws-logs';
import { Duration } from '@aws-cdk/core';
import { Env } from '@basemaps/shared';
import { getConfig } from '../config';

const CODE_PATH = '../lambda-tiler/dist';
/**
 * Create a API Key validation edge lambda
 */
export class LambdaTiler extends cdk.Construct {
    public lambda: lambda.Function;
    public version: lambda.Version;

    public constructor(scope: cdk.Stack, id: string) {
        super(scope, id);

        const config = getConfig();
        /**
         * WARNING: changing this lambda name while attached to a alb will cause cloudformation to die
         * see: https://github.com/aws/aws-cdk/issues/8253
         */
        this.lambda = new lambda.Function(this, 'Tiler', {
            runtime: lambda.Runtime.NODEJS_12_X,
            memorySize: 2048,
            timeout: Duration.seconds(10),
            handler: 'index.handler',
            code: lambda.Code.fromAsset(CODE_PATH),
            environment: {
                [Env.PublicUrlBase]: config.PublicUrlBase,
            },
            logRetention: RetentionDays.ONE_MONTH,
        });
        for (const bucketName of config.CogBucket) {
            const cogBucket = s3.Bucket.fromBucketName(this, `CogBucket${bucketName}`, bucketName);
            cogBucket.grantRead(this.lambda);
        }
    }
}

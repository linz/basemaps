import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import s3 = require('@aws-cdk/aws-s3');

import { RetentionDays } from '@aws-cdk/aws-logs';
import { VersionUtil } from '../version';
import { Duration } from '@aws-cdk/core';
import { Env } from '@basemaps/lambda-shared';
import { getConfig } from '../config';

const CODE_PATH = '../lambda-xyz/dist';
/**
 * Create a API Key validation edge lambda
 */
export class LambdaXyz extends cdk.Construct {
    public lambda: lambda.Function;
    public version: lambda.Version;

    public constructor(scope: cdk.Stack, id: string) {
        super(scope, id);

        const config = getConfig();
        const version = VersionUtil.version();
        const cogBucket = s3.Bucket.fromBucketName(this, 'CogBucket', config.CogBucket);
        this.lambda = new lambda.Function(this, 'Tiler', {
            runtime: lambda.Runtime.NODEJS_10_X,
            memorySize: 2048,
            timeout: Duration.seconds(10),
            handler: 'index.handler',
            code: lambda.Code.asset(CODE_PATH),
            environment: {
                [Env.NodeEnv]: Env.get(Env.NodeEnv, 'dev'),
                [Env.CogBucket]: cogBucket.bucketName,
                [Env.Hash]: version.hash,
                [Env.Version]: version.version,
                [Env.PublicUrlBase]: config.PublicUrlBase,
            },
            logRetention: RetentionDays.ONE_MONTH,
        });

        cogBucket.grantRead(this.lambda);
    }
}

import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import s3 = require('@aws-cdk/aws-s3');

import { RetentionDays } from '@aws-cdk/aws-logs';
import { VersionUtil } from '../version';
import { Duration } from '@aws-cdk/core';
import { Env } from '@basemaps/shared';

const CODE_PATH = '../lambda-xyz/dist';
/**
 * Create a API Key validation edge lambda
 */
export class LambdaXyz extends cdk.Construct {
    public lambda: lambda.Function;
    public version: lambda.Version;

    public constructor(scope: cdk.Stack, id: string) {
        super(scope, id);

        const version = VersionUtil.version();
        const cogBucket = s3.Bucket.fromBucketName(this, 'CogBucket', 'basemaps-cog-test');
        this.lambda = new lambda.Function(this, 'Tiler', {
            runtime: lambda.Runtime.NODEJS_10_X,
            memorySize: 1536,
            timeout: Duration.seconds(10),
            handler: 'index.handler',
            code: lambda.Code.asset(CODE_PATH),
            environment: {
                COG_BUCKET: cogBucket.bucketName,
                [Env.Hash]: version.hash,
                [Env.Version]: version.version,
            },
            logRetention: RetentionDays.ONE_MONTH,
        });

        cogBucket.grantRead(this.lambda);

        // CloudFront requires a specific version for a lambda,
        // so using a hash of the source code create a version
        this.version = this.lambda.addVersion(':sha256:' + VersionUtil.hash(CODE_PATH));

        // Output the edge lambda's ARN
        new cdk.CfnOutput(this, 'LambdaXyz', {
            value: cdk.Fn.join(':', [this.lambda.functionArn, this.version.version]),
        });
    }
}

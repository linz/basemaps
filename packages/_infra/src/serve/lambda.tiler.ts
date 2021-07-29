import { IVpc } from '@aws-cdk/aws-ec2';
import * as lambda from '@aws-cdk/aws-lambda';
import { RetentionDays } from '@aws-cdk/aws-logs';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { Duration } from '@aws-cdk/core';
import { Env } from '@basemaps/shared';
import { getConfig } from '../config';

const CODE_PATH = '../lambda-tiler/dist';

export interface LambdaTilerProps {
    vpc: IVpc;
}
/**
 * Create a API Key validation edge lambda
 */
export class LambdaTiler extends cdk.Construct {
    public lambda: lambda.Function;
    public version: lambda.Version;

    public constructor(scope: cdk.Stack, id: string, props: LambdaTilerProps) {
        super(scope, id);

        const config = getConfig();
        /**
         * WARNING: changing this lambda name while attached to a alb will cause cloudformation to die
         * see: https://github.com/aws/aws-cdk/issues/8253
         */
        this.lambda = new lambda.Function(this, 'Tiler', {
            vpc: props.vpc,
            runtime: lambda.Runtime.NODEJS_14_X,
            memorySize: 2048,
            timeout: Duration.seconds(60),
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

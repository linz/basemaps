import cdk from '@aws-cdk/core';
import lambda from '@aws-cdk/aws-lambda';
import s3 from '@aws-cdk/aws-s3';
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import { RetentionDays } from '@aws-cdk/aws-logs';
import { Bucket } from '@aws-cdk/aws-s3';
import { Duration } from '@aws-cdk/core';
import { Env } from '@basemaps/shared';

const CODE_PATH = '../lambda-analytics/dist';

export interface EdgeAnalyticsProps extends cdk.StackProps {
    distributionId: string;
    logBucketName: string;
}

/**
 * Every hour create analytics based off the logs given to us from cloudwatch
 */
export class EdgeAnalytics extends cdk.Stack {
    public lambda: lambda.Function;

    public constructor(scope: cdk.Construct, id: string, props: EdgeAnalyticsProps) {
        super(scope, id, props);

        const { distributionId, logBucketName } = props;

        const logBucket = Bucket.fromBucketName(this, 'EdgeLogBucket', logBucketName);

        const cacheBucket = new s3.Bucket(this, 'AnalyticCacheBucket');
        this.lambda = new lambda.Function(this, 'AnalyticLambda', {
            runtime: lambda.Runtime.NODEJS_14_X,
            memorySize: 2048,
            timeout: Duration.minutes(10),
            handler: 'index.handler',
            code: lambda.Code.fromAsset(CODE_PATH),
            environment: {
                [Env.Analytics.CloudFrontId]: distributionId,
                [Env.Analytics.CacheBucket]: `s3://${cacheBucket.bucketName}`,
                [Env.Analytics.CloudFrontSourceBucket]: `s3://${logBucket.bucketName}`,
            },
            logRetention: RetentionDays.ONE_MONTH,
        });

        cacheBucket.grantReadWrite(this.lambda);
        logBucket.grantRead(this.lambda);

        // Run this lambda function every hour
        const rule = new Rule(this, 'AnalyticRule', { schedule: Schedule.rate(Duration.hours(1)) });
        rule.addTarget(new LambdaFunction(this.lambda));
    }
}

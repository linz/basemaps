import { Env } from '@basemaps/shared';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import lambda from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

const CODE_PATH = '../lambda-analytics/dist';

export interface EdgeAnalyticsProps extends StackProps {
  distributionId: string;
  logBucketName: string;
}

/**
 * Every hour create analytics based off the logs given to us from cloudwatch
 */
export class EdgeAnalytics extends Stack {
  public lambda: lambda.Function;

  public constructor(scope: Construct, id: string, props: EdgeAnalyticsProps) {
    super(scope, id, props);

    const { distributionId, logBucketName } = props;

    const logBucket = Bucket.fromBucketName(this, 'EdgeLogBucket', logBucketName);

    const cacheBucket = new Bucket(this, 'AnalyticCacheBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    this.lambda = new lambda.Function(this, 'AnalyticLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 2048,
      timeout: Duration.minutes(10),
      handler: 'index.handler',
      code: lambda.Code.fromAsset(CODE_PATH),
      environment: {
        [Env.Analytics.CloudFrontId]: distributionId,
        [Env.Analytics.CacheBucket]: `s3://${cacheBucket.bucketName}`,
        [Env.Analytics.CloudFrontSourceBucket]: `s3://${logBucket.bucketName}`,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      logRetention: RetentionDays.ONE_MONTH,
      loggingFormat: lambda.LoggingFormat.JSON,
    });

    cacheBucket.grantReadWrite(this.lambda);
    logBucket.grantRead(this.lambda);

    // Run this lambda function every hour
    const rule = new Rule(this, 'AnalyticRule', { schedule: Schedule.rate(Duration.hours(1)) });
    rule.addTarget(new LambdaFunction(this.lambda));
  }
}

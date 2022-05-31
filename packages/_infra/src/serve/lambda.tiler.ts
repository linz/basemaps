import { Env } from '@basemaps/shared';
import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { getConfig } from '../config.js';

const CODE_PATH = '../lambda-tiler/dist';

export interface LambdaTilerProps {
  vpc: IVpc;
}
/**
 * Create a API Key validation edge lambda
 */
export class LambdaTiler extends Construct {
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
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      logRetention: RetentionDays.ONE_MONTH,
    });
    for (const bucketName of config.CogBucket) {
      const cogBucket = s3.Bucket.fromBucketName(this, `CogBucket${bucketName}`, bucketName);
      cogBucket.grantRead(this.lambda);
    }
  }
}

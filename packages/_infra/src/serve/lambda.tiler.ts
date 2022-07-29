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

  /** Location of static files */
  staticBucketName?: string;
}
/**
 * Create a API Key validation edge lambda
 */
export class LambdaTiler extends Construct {
  public lambda: lambda.Function[];
  public version: lambda.Version;
  public functionUrl: lambda.FunctionUrl;

  public lambdaNoVpc: lambda.Function;
  public lambdaVpc: lambda.Function;

  public constructor(scope: cdk.Stack, id: string, props: LambdaTilerProps) {
    super(scope, id);

    const config = getConfig();

    const environment: Record<string, string> = {
      [Env.PublicUrlBase]: config.PublicUrlBase,
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    };

    if (props.staticBucketName) environment[Env.AssetLocation] = `s3://${props.staticBucketName}`;

    const code = lambda.Code.fromAsset(CODE_PATH);
    /**
     * WARNING: changing this lambda name while attached to a alb will cause cloudformation to die
     * see: https://github.com/aws/aws-cdk/issues/8253
     */
    this.lambdaVpc = new lambda.Function(this, 'Tiler', {
      vpc: props.vpc,
      runtime: lambda.Runtime.NODEJS_16_X,
      memorySize: 2048,
      timeout: Duration.seconds(60),
      handler: 'index.handler',
      code,
      environment,
      logRetention: RetentionDays.ONE_MONTH,
    });

    /**
     * While moving to function URLS create two separate lambda functions
     * This lambda does not need to be inside of a VPC
     */

    this.lambdaNoVpc = new lambda.Function(this, 'TilerNoVpc', {
      runtime: lambda.Runtime.NODEJS_16_X,
      memorySize: 2048,
      timeout: Duration.seconds(60),
      handler: 'index.handler',
      code,
      environment,
      logRetention: RetentionDays.ONE_MONTH,
    });

    this.functionUrl = new lambda.FunctionUrl(this, 'LambdaCogUrl', {
      function: this.lambdaNoVpc,
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    if (props.staticBucketName) {
      const staticBucket = s3.Bucket.fromBucketName(this, 'StaticBucket', props.staticBucketName);
      staticBucket.grantRead(this.lambdaNoVpc);
      staticBucket.grantRead(this.lambdaVpc);
    }

    for (const bucketName of config.CogBucket) {
      const cogBucket = s3.Bucket.fromBucketName(this, `CogBucket${bucketName}`, bucketName);
      cogBucket.grantRead(this.lambdaNoVpc);
      cogBucket.grantRead(this.lambdaVpc);
    }
  }
}

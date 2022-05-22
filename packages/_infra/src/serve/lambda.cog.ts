import { Env } from '@basemaps/shared';
import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { getConfig } from '../config.js';
import iam from 'aws-cdk-lib/aws-iam';

const CODE_PATH = '../lambda-cog/dist';

/**
 * Create a lambda for cogs import api
 */
export class LambdaCog extends Construct {
  public lambda: lambda.Function;
  public functionUrl: lambda.FunctionUrl;
  public version: lambda.Version;

  public constructor(scope: cdk.Stack, id: string) {
    super(scope, id);

    const config = getConfig();
    this.lambda = new lambda.Function(this, 'Cog', {
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 2048,
      timeout: Duration.seconds(60),
      handler: 'index.handler',
      code: lambda.Code.fromAsset(CODE_PATH),
      environment: {
        [Env.PublicUrlBase]: config.PublicUrlBase,
        [Env.AwsRoleConfigBucket]: config.AwsRoleConfigBucket,
        [Env.ImportImageryBucket]: config.ImportImageryBucket,
        [Env.ImportFilesNumberLimit]: config.ImportFilesNumberLimit,
        [Env.ImportFilesSizeLimit]: config.ImportFilesSizeLimit,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      logRetention: RetentionDays.ONE_MONTH,
    });
    const configBucket = s3.Bucket.fromBucketName(this, 'ConfigBucket', config.AwsRoleConfigBucket);
    configBucket.grantRead(this.lambda);

    // We need to assume role to find imagery from data lake
    const stsPolicy = new iam.PolicyStatement();
    stsPolicy.addActions('sts:AssumeRole');
    stsPolicy.addAllResources();
    this.lambda.role?.attachInlinePolicy(
      new iam.Policy(this, 'AssumeRolePolicy', {
        statements: [stsPolicy],
      }),
    );

    this.functionUrl = new lambda.FunctionUrl(this, 'LambdaCogUrl', {
      function: this.lambda,
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.GET],
        allowCredentials: true,
        maxAge: cdk.Duration.minutes(1),
      },
    });
  }
}

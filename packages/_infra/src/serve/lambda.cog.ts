import { Env } from '@basemaps/shared';
import * as cdk from 'aws-cdk-lib';
import { Duration, Stack } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { getConfig } from '../config.js';
import iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { TileMetadataTableArn } from './db.js';

const CODE_PATH = '../lambda-cog/dist';

/**
 * Create a lambda for cogs import api
 */

export class CogStack extends Stack {
  public lambda: lambda.Function;
  public functionUrl: lambda.FunctionUrl;
  public version: lambda.Version;

  public constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const config = getConfig();
    this.lambda = new lambda.Function(this, 'LambdaCog', {
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 2048,
      timeout: Duration.minutes(10),
      handler: 'index.handler',
      code: lambda.Code.fromAsset(CODE_PATH),
      environment: {
        [Env.PublicUrlBase]: config.PublicUrlBase,
        [Env.AwsRoleConfigBucket]: config.AwsRoleConfigBucket,
        [Env.ImportImageryBucket]: config.ImportImageryBucket,
        [Env.ImportFilesNumberLimit]: config.ImportFilesNumberLimit,
        [Env.ImportFilesSizeLimitGb]: config.ImportFilesSizeLimitGb,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      },
      logRetention: RetentionDays.ONE_MONTH,
    });

    // Grant access to s3
    const cogBucket = s3.Bucket.fromBucketName(this, `CogBucket`, config.ImportImageryBucket);
    cogBucket.grantRead(this.lambda);
    cogBucket.grantWrite(this.lambda);
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

    const dynamoPolicy = new iam.PolicyStatement();
    dynamoPolicy.addActions('dynamoDB:getItem', 'dynamoDB:putItem');
    dynamoPolicy.addResources(TileMetadataTableArn.getArn(this));
    this.lambda.role?.attachInlinePolicy(
      new iam.Policy(this, 'DynamoDBWritePolicy', {
        statements: [dynamoPolicy],
      }),
    );

    const batchPolicy = new iam.PolicyStatement();
    batchPolicy.addActions('batch:ListJobs', 'batch:SubmitJob');
    batchPolicy.addAllResources();
    this.lambda.role?.attachInlinePolicy(
      new iam.Policy(this, 'BatchPolicy', {
        statements: [batchPolicy],
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

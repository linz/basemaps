import assert from 'node:assert';

import { Env, isValidApiKey } from '@basemaps/shared';
import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

import { getConfig } from '../config.js';

const CODE_PATH = '../lambda-tiler/dist';

export interface LambdaTilerProps {
  /** Location of static files */
  staticBucketName?: string;
}
/**
 * Create a API Key validation edge lambda
 */
export class LambdaTiler extends Construct {
  public functionUrl: lambda.FunctionUrl;

  public lambdaNoVpc: lambda.Function;

  public constructor(scope: cdk.Stack, id: string, props: LambdaTilerProps) {
    super(scope, id);

    const config = getConfig();

    const environment: Record<string, string> = {
      [Env.PublicUrlBase]: config.PublicUrlBase,
      [Env.AwsRoleConfigPath]: `s3://${config.AwsRoleConfigBucket}/config.json`,
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    };

    if (props.staticBucketName) {
      environment[Env.StaticAssetLocation] = `s3://${props.staticBucketName}/`;
    }

    // Set blocked api keys if some are present
    const blockedKeys = Env.get(Env.BlockedApiKeys) ?? '';
    if (blockedKeys.length > 0) {
      const listOfKeys = JSON.parse(blockedKeys) as string[];
      if (!Array.isArray(listOfKeys)) throw new Error(` ${Env.BlockedApiKeys} is not valid`);
      for (const key of listOfKeys) {
        assert.ok(isValidApiKey(key).valid, `${key} is not a valid api key to block ${Env.BlockedApiKeys}`);
      }
      environment[Env.BlockedApiKeys] = blockedKeys;
    }

    const code = lambda.Code.fromAsset(CODE_PATH);

    /**
     * While moving to function URLS create two separate lambda functions
     * This lambda does not need to be inside of a VPC
     */

    this.lambdaNoVpc = new lambda.Function(this, 'TilerNoVpc', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 2048,
      timeout: Duration.seconds(60),
      handler: 'index.handler',
      code,
      architecture: lambda.Architecture.ARM_64,
      environment,
      logRetention: RetentionDays.ONE_MONTH,
      loggingFormat: lambda.LoggingFormat.JSON,
    });

    this.functionUrl = new lambda.FunctionUrl(this, 'LambdaCogUrl', {
      function: this.lambdaNoVpc,
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    const stsPolicy = new iam.PolicyStatement();
    stsPolicy.addActions('sts:AssumeRole');
    stsPolicy.addAllResources();
    this.lambdaNoVpc.role?.attachInlinePolicy(new iam.Policy(this, 'AssumeRolePolicy', { statements: [stsPolicy] }));

    if (props.staticBucketName) {
      const staticBucket = s3.Bucket.fromBucketName(this, 'StaticBucket', props.staticBucketName);
      staticBucket.grantRead(this.lambdaNoVpc);
    }

    for (const bucketName of config.CogBucket) {
      const cogBucket = s3.Bucket.fromBucketName(this, `CogBucket${bucketName}`, bucketName);
      cogBucket.grantRead(this.lambdaNoVpc);
    }

    const configBucket = s3.Bucket.fromBucketName(this, 'ConfigBucket', config.AwsRoleConfigBucket);
    configBucket.grantRead(this.lambdaNoVpc);
  }
}

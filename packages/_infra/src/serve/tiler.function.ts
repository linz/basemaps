import cdk, { StackProps } from 'aws-cdk-lib';
import lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { getConfig } from '../config.js';
import { LambdaTiler } from './lambda.tiler.js';

export class TilerFunction extends cdk.Stack {
  public constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    const config = getConfig();
    const tiler = new LambdaTiler(this, 'Tiler', { buckets: config.CogBucket });
    new lambda.FunctionUrl(this, 'TilerUrl', {
      function: tiler.lambda,
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

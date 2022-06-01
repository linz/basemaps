import cdk, { StackProps } from 'aws-cdk-lib';
import lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { getConfig } from '../config.js';
import { LambdaTiler } from './lambda.tiler.js';

export interface TilerFunctionProps extends StackProps {
  /** Configuration path */
  config: string;
}

export class TilerFunction extends cdk.Stack {
  public constructor(scope: Construct, id: string, props: TilerFunctionProps) {
    super(scope, id, props);

    const config = getConfig();
    const tiler = new LambdaTiler(this, 'Tiler', {
      buckets: config.CogBucket,
      config: props.config,
    });

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

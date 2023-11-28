import cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { ParametersServeKeys } from '../parameters.js';
import { TileMetadataTable } from './db.js';
import { LambdaTiler } from './lambda.tiler.js';

export interface ServeStackProps extends cdk.StackProps {
  /** Location of static files */
  staticBucketName?: string;
}

/**
 * Tile serving infrastructure
 */
export class ServeStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props: ServeStackProps) {
    super(scope, id, props);

    const lambda = new LambdaTiler(this, 'LambdaTiler', { staticBucketName: props.staticBucketName });
    const table = new TileMetadataTable(this, 'TileMetadata');
    table.table.grantReadData(lambda.lambdaNoVpc);

    new cdk.CfnOutput(this, ParametersServeKeys.LambdaXyzUrl, { value: lambda.functionUrl.url });
  }
}

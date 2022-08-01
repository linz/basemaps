import cert from 'aws-cdk-lib/aws-certificatemanager';
import ec2 from 'aws-cdk-lib/aws-ec2';
import elbv2, { ApplicationProtocol, SslPolicy } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import r53 from 'aws-cdk-lib/aws-route53';
import cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { getConfig } from '../config.js';
import { TileMetadataTable } from './db.js';
import { LambdaTiler } from './lambda.tiler.js';
import { ParametersServeKeys } from '../parameters.js';

export interface ServeStackProps extends cdk.StackProps {
  /** ACM certificate to use for the ALB */
  albCertificateArn: string;

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
    table.table.grantReadData(lambda.lambdaVpc);
    table.table.grantReadData(lambda.lambdaNoVpc);

    new cdk.CfnOutput(this, ParametersServeKeys.LambdaXyzUrl, { value: lambda.functionUrl.url });
  }
}

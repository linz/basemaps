import cdk = require('@aws-cdk/core');
import cf = require('@aws-cdk/aws-cloudfront');
import s3 = require('@aws-cdk/aws-s3');
import { LambdaApiKeyValidator } from './lambda.edge.api.key';

/**
 * Edge infrastructure
 *
 * This will setup all the edge infrastructure needed for basemaps, including:
 * * CloudFront CDN
 * * API Tracking Lambda@edge
 */
export class EdgeStack extends cdk.Stack {
    public constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const lambda = new LambdaApiKeyValidator(this, 'LambdaEdge');
        // TODO enable cloudfront
    }
}

import cdk = require('@aws-cdk/core');
import { LambdaApiKeyValidator } from './lambda.edge.api.key';

/**
 * Edge infrastructure
 *
 * This will setup all the edge infrastructure needed for basemaps, including:
 * * CloudFront CDN
 * * API Tracking Lambda@edge
 */
export class EdgeStack extends cdk.Stack {
    public lambda: LambdaApiKeyValidator;
    public constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.lambda = new LambdaApiKeyValidator(this, 'LambdaEdge');
        // TODO enable cloudfront
    }
}

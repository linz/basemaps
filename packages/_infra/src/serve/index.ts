import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import targets = require('@aws-cdk/aws-elasticloadbalancingv2-targets');

import { LambdaXyz } from './lambda.xyz';

/**
 * Tile serving infrastructure
 */
export class ServeStack extends cdk.Stack {
    public constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const lambda = new LambdaXyz(this, 'LambdaXyz');

        // TODO if/when the default VPC is set to default we can switch this to 'isDefault: true'
        // eslint-disable-next-line @typescript-eslint/camelcase
        const vpc = ec2.Vpc.fromLookup(this, 'AlbVpc', { tags: { AWS_Solutions: 'LandingZoneStackSet' } });
        const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
            vpc,
            internetFacing: false,
        });

        const listener = lb.addListener('Listener', {
            port: 80,
        });

        listener.addTargets('XyzServe', {
            targets: [new targets.LambdaTarget(lambda.lambda)],
        });

        new cdk.CfnOutput(this, 'LambdaXyzAlb', {
            value: lb.loadBalancerDnsName,
        });
    }
}

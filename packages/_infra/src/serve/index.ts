import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import targets = require('@aws-cdk/aws-elasticloadbalancingv2-targets');
import cert = require('@aws-cdk/aws-certificatemanager');
import r53 = require('@aws-cdk/aws-route53');

import { LambdaTiler } from './lambda.tiler';
import { ApplicationProtocol, SslPolicy } from '@aws-cdk/aws-elasticloadbalancingv2';
import { DeployEnv } from '../deploy.env';
import { Env } from '@basemaps/shared';
import { getConfig } from '../config';
import { TileMetadataTable } from './db';

/**
 * Tile serving infrastructure
 */
export class ServeStack extends cdk.Stack {
    public constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const config = getConfig();
        /**
         * WARNING: changing this lambda name while attached to a alb will cause cloudformation to die
         * see: https://github.com/aws/aws-cdk/issues/8253
         */
        const lambda = new LambdaTiler(this, 'LambdaTiler');
        const table = new TileMetadataTable(this, 'TileMetadata');
        table.table.grantReadData(lambda.lambda);

        const vpc = ec2.Vpc.fromLookup(this, 'AlbVpc', { tags: { default: 'true' } });
        const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', { vpc, internetFacing: false });

        const targetLambda = new targets.LambdaTarget(lambda.lambda);
        const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
            targets: [targetLambda],
            healthCheck: {
                path: '/health',
                healthyThresholdCount: 2,
            },
        });
        lb.addListener('HttpListener', {
            port: 80,
            protocol: ApplicationProtocol.HTTP,
            defaultTargetGroups: [targetGroup],
        });

        // Due to the convoluted way of getting SSL certificates, we have a provisioned certificate
        // in our account we need to look it up
        const certArn = Env.get(DeployEnv.AlbTlsCertArn);
        if (certArn == null) {
            console.error('No ALB certificate provided, falling back to listening on port 80 only');
        } else {
            const sslCert = cert.Certificate.fromCertificateArn(this, 'AlbCert', certArn);

            lb.addListener('HttpsListener', {
                port: 443,
                protocol: ApplicationProtocol.HTTPS,
                sslPolicy: SslPolicy.RECOMMENDED,
                certificateArns: [sslCert.certificateArn],
                defaultTargetGroups: [targetGroup],
            });
        }

        const dnsZone = r53.HostedZone.fromLookup(this, 'AlbDnsZone', {
            domainName: config.Route53Zone,
            privateZone: true,
        });
        const albDns = new r53.CnameRecord(this, 'AlbDnsInternal', {
            zone: dnsZone,
            recordName: 'tiles',
            domainName: lb.loadBalancerDnsName,
        });

        new cdk.CfnOutput(this, 'LambdaXyzAlb', { value: lb.loadBalancerDnsName });
        new cdk.CfnOutput(this, 'LambdaXyzDns', { value: albDns.domainName });
    }
}

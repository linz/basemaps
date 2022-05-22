import cert from 'aws-cdk-lib/aws-certificatemanager';
import ec2 from 'aws-cdk-lib/aws-ec2';
import elbv2, { ApplicationProtocol, SslPolicy } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import r53 from 'aws-cdk-lib/aws-route53';
import cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { getConfig } from '../config.js';
import { LambdaCog } from './lambda.cog.js';
import { TileMetadataTable } from '../serve/db.js';

export interface ServeStackProps extends cdk.StackProps {
  /** ACM certificate to use for the ALB */
  albCertificateArn: string;
}

/**
 * Tile serving infrastructure
 */
export class ServeImportStack extends cdk.Stack {
  public constructor(scope: Construct, id: string, props: ServeStackProps) {
    super(scope, id, props);

    const config = getConfig();
    const vpc = ec2.Vpc.fromLookup(this, 'AlbVpc', { tags: { default: 'true' } });

    /**
     * WARNING: changing this lambda name while attached to a alb will cause cloudformation to die
     * see: https://github.com/aws/aws-cdk/issues/8253
     */
    const lambda = new LambdaCog(this, 'LambdaCog', { vpc });
    const table = new TileMetadataTable(this, 'TileMetadata');
    table.table.grantReadData(lambda.lambda);

    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', { vpc, internetFacing: false });

    const targetLambda = new targets.LambdaTarget(lambda.lambda);
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targets: [targetLambda],
      healthCheck: {
        path: '/health',
        healthyThresholdCount: 2,
        enabled: true,
      },
    });
    lb.addListener('HttpListener', {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Due to the convoluted way of getting SSL certificates, we have a provisioned certificate
    // in our account we need to look it up
    const sslCert = cert.Certificate.fromCertificateArn(this, 'AlbCert', props.albCertificateArn);

    lb.addListener('HttpsListener', {
      port: 443,
      protocol: ApplicationProtocol.HTTPS,
      sslPolicy: SslPolicy.RECOMMENDED,
      certificates: [sslCert],
      defaultTargetGroups: [targetGroup],
    });

    const dnsZone = r53.HostedZone.fromLookup(this, 'AlbDnsZone', {
      domainName: config.Route53Zone,
      privateZone: true,
    });
    const albDns = new r53.CnameRecord(this, 'AlbDnsInternal', {
      zone: dnsZone,
      recordName: 'cog',
      domainName: lb.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, 'LambdaCogAlb', { value: lb.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'LambdaCogDns', { value: albDns.domainName });
  }
}

import cdk = require('@aws-cdk/core');
import cf = require('@aws-cdk/aws-cloudfront');
import s3 = require('@aws-cdk/aws-s3');
import { Bucket } from '@aws-cdk/aws-s3';
import { Env } from '@basemaps/shared';
import { getConfig } from '../config';
import { DeployEnv } from '../deploy.env';
import { Parameters } from '../parameters';

/**
 * Edge infrastructure
 *
 * This will setup all the edge infrastructure needed for basemaps, including:
 * - CloudFront CDN
 * - API Tracking Lambda@edge
 */
export class EdgeStack extends cdk.Stack {
    public logBucket: Bucket;
    public distribution: cf.CloudFrontWebDistribution;

    public constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const config = getConfig();
        const s3BucketSource = new s3.Bucket(this, 'StaticBucket');

        // Allow cloud front to read the static bucket
        const originAccessIdentity = new cf.OriginAccessIdentity(this, 'AccessIdentity', {
            comment: 'Basemaps S3 access',
        });

        s3BucketSource.grantRead(originAccessIdentity);

        const s3Source: cf.SourceConfiguration = {
            s3OriginSource: { s3BucketSource, originAccessIdentity },
            behaviors: [{ isDefaultBehavior: true }],
        };

        const tileSource: cf.SourceConfiguration = {
            customOriginSource: {
                domainName: config.AlbPublicDns,
                originProtocolPolicy: cf.OriginProtocolPolicy.HTTPS_ONLY,
            },
            behaviors: [
                {
                    pathPattern: '/v1*',
                    allowedMethods: cf.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
                    forwardedValues: {
                        /** Forward all query strings but do not use them for caching */
                        queryString: true,
                        queryStringCacheKeys: ['NOT_A_CACHE_KEY'],
                    },
                    lambdaFunctionAssociations: [],
                },
            ],
        };

        let aliasConfiguration: cf.AliasConfiguration | undefined = undefined;

        const cloudFrontTls = Env.get(DeployEnv.CloudFrontTlsCertArn);
        if (cloudFrontTls == null || cloudFrontTls === '' || config.CloudFrontDns == null) {
            console.log('No CloudFront tls certificate provided.');
        } else {
            aliasConfiguration = {
                acmCertRef: cloudFrontTls,
                names: config.CloudFrontDns,
                sslMethod: cf.SSLMethod.SNI,
                securityPolicy: cf.SecurityPolicyProtocol.TLS_V1_2_2018,
            };
            new cdk.CfnOutput(this, 'CloudFrontPublicDomain', { value: config.CloudFrontDns.join(', ') });
        }

        this.logBucket = new s3.Bucket(this, 'EdgeLogBucket');

        this.distribution = new cf.CloudFrontWebDistribution(this, 'Distribution', {
            aliasConfiguration,
            priceClass: cf.PriceClass.PRICE_CLASS_ALL,
            httpVersion: cf.HttpVersion.HTTP2,
            viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            originConfigs: [s3Source, tileSource],
            loggingConfig: { bucket: this.logBucket },
        });

        new cdk.CfnOutput(this, Parameters.Edge.LogBucketName.cfnOutput, { value: this.logBucket.bucketName });
        new cdk.CfnOutput(this, Parameters.Edge.DistributionId.cfnOutput, { value: this.distribution.distributionId });

        new cdk.CfnOutput(this, 'CloudFrontBucket', { value: s3BucketSource.bucketName });
        new cdk.CfnOutput(this, 'CloudFrontId', { value: this.distribution.distributionDomainName });
        new cdk.CfnOutput(this, 'CloudFrontDomain', { value: this.distribution.distributionDomainName });
    }
}

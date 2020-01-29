import cdk = require('@aws-cdk/core');
import cf = require('@aws-cdk/aws-cloudfront');
import s3 = require('@aws-cdk/aws-s3');
import { Env } from '@basemaps/shared';
import { DeployEnv } from '../deploy.env';
import { LambdaApiKeyValidator } from './lambda.edge.api.key';
import { getConfig } from '../config';

/**
 * Edge infrastructure
 *
 * This will setup all the edge infrastructure needed for basemaps, including:
 * - CloudFront CDN
 * - API Tracking Lambda@edge
 */
export class EdgeStack extends cdk.Stack {
    public lambda: LambdaApiKeyValidator;
    public constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.lambda = new LambdaApiKeyValidator(this, 'LambdaEdge');

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
                    // TODO track API keys with viewer requests
                    // lambdaFunctionAssociations: [lambdaViewerRequest],
                },
            ],
        };

        let aliasConfiguration: cf.AliasConfiguration | undefined = undefined;

        const cloudFrontTls = Env.get(DeployEnv.CloudFrontTlsCertArn);
        if (cloudFrontTls == null || cloudFrontTls == '' || config.CloudFrontDns == null) {
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

        const dist = new cf.CloudFrontWebDistribution(this, 'Distribution', {
            aliasConfiguration,
            priceClass: cf.PriceClass.PRICE_CLASS_ALL,
            httpVersion: cf.HttpVersion.HTTP2,
            viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            originConfigs: [s3Source, tileSource],
        });

        new cdk.CfnOutput(this, 'CloudFrontDomain', { value: dist.domainName });
    }
}

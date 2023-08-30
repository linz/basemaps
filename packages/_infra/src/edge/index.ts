import cdk from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import cf from 'aws-cdk-lib/aws-cloudfront';
import s3, { Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { getConfig } from '../config.js';
import { ParametersEdgeKeys } from '../parameters.js';

export interface EdgeStackProps extends cdk.StackProps {
  /** ACM certificate to use for cloudfront */
  cloudfrontCertificateArn: string;

  /** Is the lambda deployed as a function url somewhere */
  lambdaUrl?: string;
}
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

  public constructor(scope: Construct, id: string, props: EdgeStackProps) {
    super(scope, id, props);

    const config = getConfig();
    const s3BucketSource = new s3.Bucket(this, 'StaticBucket', {
      cors: [
        {
          allowedOrigins: ['*'],
          allowedMethods: [HttpMethods.GET, HttpMethods.HEAD],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Allow cloud front to read the static bucket
    const originAccessIdentity = new cf.OriginAccessIdentity(this, 'AccessIdentity', {
      comment: 'Basemaps S3 access',
    });

    s3BucketSource.grantRead(originAccessIdentity);

    const s3Source: cf.SourceConfiguration = {
      s3OriginSource: { s3BucketSource, originAccessIdentity },
      behaviors: [
        {
          isDefaultBehavior: true,
          allowedMethods: cf.CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
          forwardedValues: {
            queryString: true,
            // From https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html
            // "CORS-S3Origin"
            headers: ['Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
          },
        },
      ],
    };

    const acmCert = Certificate.fromCertificateArn(this, 'Cert', props.cloudfrontCertificateArn);
    const viewerCertificate = cf.ViewerCertificate.fromAcmCertificate(acmCert, {
      aliases: config.CloudFrontDns,
    });
    new cdk.CfnOutput(this, 'CloudFrontPublicDomain', { value: config.CloudFrontDns.join(', ') });

    this.logBucket = new s3.Bucket(this, 'EdgeLogBucket');
    const originConfigs = [s3Source];
    if (props.lambdaUrl) originConfigs.push(this.lambdaUrlSource(props.lambdaUrl));

    this.distribution = new cf.CloudFrontWebDistribution(this, 'Distribution', {
      viewerCertificate,
      priceClass: cf.PriceClass.PRICE_CLASS_ALL,
      httpVersion: cf.HttpVersion.HTTP2,
      viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originConfigs,
      loggingConfig: { bucket: this.logBucket },
    });

    new cdk.CfnOutput(this, ParametersEdgeKeys.CloudFrontLogBucket, { value: this.logBucket.bucketName });
    new cdk.CfnOutput(this, ParametersEdgeKeys.CloudFrontDistributionId, { value: this.distribution.distributionId });
    new cdk.CfnOutput(this, ParametersEdgeKeys.CloudFrontBucket, { value: s3BucketSource.bucketName });
    new cdk.CfnOutput(this, 'CloudFrontId', { value: this.distribution.distributionDomainName });
    new cdk.CfnOutput(this, 'CloudFrontDomain', { value: this.distribution.distributionDomainName });
  }

  lambdaUrlSource(lambdaUrl: string): cf.SourceConfiguration {
    const trimmedUrl = new URL(lambdaUrl); // LambdaURLS include https:// and a trailing /

    return {
      customOriginSource: {
        domainName: trimmedUrl.hostname,
        originProtocolPolicy: cf.OriginProtocolPolicy.HTTPS_ONLY,
      },
      behaviors: [
        {
          pathPattern: '/v1*',
          allowedMethods: cf.CloudFrontAllowedMethods.ALL,
          forwardedValues: {
            /** Forward all query strings but do not use them for caching */
            queryString: true,
            queryStringCacheKeys: ['config', 'exclude'].map(encodeURIComponent),
          },
          lambdaFunctionAssociations: [],
        },
        {
          pathPattern: '/@*',
          allowedMethods: cf.CloudFrontAllowedMethods.ALL,
          forwardedValues: {
            /** Forward all query strings but do not use them for caching */
            queryString: true,
            queryStringCacheKeys: [
              'config',
              'exclude',
              'tileSet',
              'style',
              // Deprecated single character query params for style and projection
              's',
              'p',
              'i', // ?i=:imageryId is deprecated and should be removed at some point
            ].map(encodeURIComponent),
          },
          lambdaFunctionAssociations: [],
        },
      ],
    };
  }
}

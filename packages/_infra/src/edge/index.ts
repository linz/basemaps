import cdk from 'aws-cdk-lib';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import cf from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
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
  public distribution: cf.Distribution;

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

    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(s3BucketSource);

    const acmCert = Certificate.fromCertificateArn(this, 'Cert', props.cloudfrontCertificateArn);
    new cdk.CfnOutput(this, 'CloudFrontPublicDomain', { value: config.CloudFrontDns.join(', ') });

    this.logBucket = new s3.Bucket(this, 'EdgeLogBucket');

    const additionalBehaviors: Record<string, cf.BehaviorOptions> = {};

    if (props.lambdaUrl) {
      const trimmedUrl = new URL(props.lambdaUrl); // LambdaURLS include https:// and a trailing /
      const lambdaOrigin = new origins.HttpOrigin(trimmedUrl.hostname, {
        protocolPolicy: cf.OriginProtocolPolicy.HTTPS_ONLY,
      });

      const v1CachePolicy = new cf.CachePolicy(this, 'V1CachePolicy', {
        queryStringBehavior: cf.CacheQueryStringBehavior.allowList('config', 'exclude', 'pipeline'),
      });

      const atCachePolicy = new cf.CachePolicy(this, 'AtCachePolicy', {
        queryStringBehavior: cf.CacheQueryStringBehavior.allowList(
          'config',
          'exclude',
          'tileMatrix',
          'style',
          'pipeline',
          'terrain',
        ),
      });

      additionalBehaviors['/v1*'] = {
        origin: lambdaOrigin,
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cf.AllowedMethods.ALLOW_ALL,
        cachePolicy: v1CachePolicy,
        originRequestPolicy: cf.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      };

      additionalBehaviors['/@*'] = {
        origin: lambdaOrigin,
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cf.AllowedMethods.ALLOW_ALL,
        cachePolicy: atCachePolicy,
        originRequestPolicy: cf.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      };
    }

    this.distribution = new cf.Distribution(this, 'Distribution', {
      domainNames: config.CloudFrontDns,
      certificate: acmCert,
      priceClass: cf.PriceClass.PRICE_CLASS_ALL,
      httpVersion: cf.HttpVersion.HTTP2,
      logBucket: this.logBucket,
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        originRequestPolicy: cf.OriginRequestPolicy.CORS_S3_ORIGIN,
        cachePolicy: cf.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors,
    });

    // Override logical ID to match deprecated CloudFrontWebDistribution logical ID to update in-place without destroying old distribution
    (this.distribution.node.defaultChild as cdk.CfnResource).overrideLogicalId('DistributionCFDistribution882A7313');

    new cdk.CfnOutput(this, ParametersEdgeKeys.CloudFrontLogBucket, { value: this.logBucket.bucketName });
    new cdk.CfnOutput(this, ParametersEdgeKeys.CloudFrontDistributionId, { value: this.distribution.distributionId });
    new cdk.CfnOutput(this, ParametersEdgeKeys.CloudFrontBucket, { value: s3BucketSource.bucketName });
    new cdk.CfnOutput(this, 'CloudFrontId', { value: this.distribution.distributionDomainName });
    new cdk.CfnOutput(this, 'CloudFrontDomain', { value: this.distribution.distributionDomainName });
  }
}

import { ACMClient, ListCertificatesCommand } from '@aws-sdk/client-acm';
import { Env } from '@basemaps/shared';
import { applyTags, SecurityClassification } from '@linzjs/cdk-tags';
import { App } from 'aws-cdk-lib';
import { Classification } from 'aws-cdk-lib/aws-stepfunctions-tasks';

import { EdgeAnalytics } from './analytics/edge.analytics.js';
import { BaseMapsRegion, getConfig, IsProduction } from './config.js';
import { DeployEnv } from './deploy.env.js';
import { EdgeStack } from './edge/index.js';
import { getParameters, ParametersEdgeKeys, ParametersServeKeys } from './parameters.js';
import { ServeStack } from './serve/index.js';

/** Find a certificate for a given domain in a specific region */
async function findCertForDomain(region: string, domain: string): Promise<string | undefined> {
  const client = new ACMClient({ region });
  const command = new ListCertificatesCommand({ CertificateStatuses: ['ISSUED'] });
  const data = await client.send(command);
  return data.CertificateSummaryList?.find((f) => f.DomainName?.endsWith(domain))?.CertificateArn;
}

async function main(): Promise<void> {
  const basemaps = new App();

  const commonTags = {
    application: 'basemaps',
    environment: IsProduction ? 'prod' : 'nonprod',
    group: 'li',
    classification: SecurityClassification.Unclassified,
  } as const;

  /** Using VPC lookups requires a hard coded AWS "account" */
  const account = Env.get(DeployEnv.CdkAccount);

  const config = getConfig();

  // Cloudfront certs have to be deployed into us-east-1
  const cloudfrontCertificateArn = await findCertForDomain('us-east-1', config.CloudFrontDns[0]);
  if (cloudfrontCertificateArn == null) {
    console.error('Unable to find CloudFront Certificate');
    return;
  }
  // TODO is there a better way of handling this,
  // since this requires Edge to be deployed this will not deploy on the first deployment of new accounts
  const [edgeParams, serveParams] = await Promise.all([
    getParameters('us-east-1', 'Edge', ParametersEdgeKeys),
    getParameters('ap-southeast-2', 'Serve', ParametersServeKeys),
  ]);

  /**
   * Because we are using CloudFront the edge stack has to be deployed into us-east-1,
   * The dynamoDb table needs to be close to our users that has to be deployed in ap-southeast-2
   */
  const edge = new EdgeStack(basemaps, 'Edge', {
    env: { region: 'us-east-1', account },
    cloudfrontCertificateArn,
    lambdaUrl: serveParams?.LambdaXyzUrl,
  });
  applyTags(edge, commonTags);

  const serve = new ServeStack(basemaps, 'Serve', {
    env: { region: BaseMapsRegion, account },
    staticBucketName: edgeParams?.CloudFrontBucket,
  });
  applyTags(serve, commonTags);
  edge.addDependency(serve);

  if (edgeParams != null) {
    const analytics = new EdgeAnalytics(basemaps, 'Analytics', {
      env: { region: BaseMapsRegion, account },
      logBucketName: edgeParams.CloudFrontLogBucket,
      distributionId: edgeParams.CloudFrontDistributionId,
    });
    analytics.addDependency(edge);
    applyTags(analytics, commonTags);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

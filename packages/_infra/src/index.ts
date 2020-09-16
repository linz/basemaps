import { App } from '@aws-cdk/core';
import { Env } from '@basemaps/shared';
import { EdgeAnalytics } from './analytics/edge.analytics';
import { ApiKeyTableStack } from './api.key.db';
import { CogBuilderStack } from './cogify';
import { BaseMapsRegion } from './config';
import { DeployEnv } from './deploy.env';
import { EdgeStack } from './edge';
import { LoggingStack } from './log';
import { getEdgeParameters } from './parameters';
import { ServeStack } from './serve';

async function main(): Promise<void> {
    const basemaps = new App();

    /** Using VPC lookups requires a hard coded AWS "account" */
    const account = Env.get(DeployEnv.CdkAccount);

    new LoggingStack(basemaps, 'Logging', { env: { region: BaseMapsRegion, account } });

    /**
     * Because we are using Lambda@Edge the edge stack has to be deployed into us-east-1,
     * The dynamoDb table needs to be close to our users that has to be deployed in ap-southeast-2
     */
    const table = new ApiKeyTableStack(basemaps, 'ApiKeyTable', { env: { region: BaseMapsRegion, account } });
    const edge = new EdgeStack(basemaps, 'Edge', { env: { region: 'us-east-1', account } });
    const serve = new ServeStack(basemaps, 'Serve', { env: { region: BaseMapsRegion, account } });

    edge.addDependency(table);
    edge.addDependency(serve);

    // TODO is there a better way of handling this,
    // since this requires Edge to be deployed this will not deploy on the first deployment of new accounts
    const edgeParams = await getEdgeParameters(edge);
    if (edgeParams != null) {
        const analytics = new EdgeAnalytics(basemaps, 'Analytics', {
            env: { region: BaseMapsRegion, account },
            logBucketName: edgeParams.cloudFrontLogBucketName,
            distributionId: edgeParams.cloudFrontDistributionId,
        });
        analytics.addDependency(edge);
    }

    new CogBuilderStack(basemaps, 'CogBuilder', { env: { region: BaseMapsRegion, account } });
}

main().catch((e) => console.error(e));

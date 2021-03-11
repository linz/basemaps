import { LogConfig } from '@basemaps/shared';
import CloudFormation from 'aws-sdk/clients/cloudformation';
import CloudFront from 'aws-sdk/clients/cloudfront';
import { CliId } from './base.cli';

// Cloudfront has to be defined in us-east-1
const cloudFormation = new CloudFormation({ region: 'us-east-1' });
const cloudFront = new CloudFront({ region: 'us-east-1' });

/** cloudfront invalidation references need to be unique */
let InvalidationId = 0;

/**
 * Invalidate the cloudfront distribution cache when updating imagery sets
 */
export async function invalidateCache(path: string, commit = false): Promise<void> {
    const stackInfo = await cloudFormation.describeStacks({ StackName: 'Edge' }).promise();
    if (stackInfo.Stacks?.[0].Outputs == null) {
        LogConfig.get().warn('Unable to find cloud front distribution');
        return;
    }
    const cloudFrontDomain = stackInfo.Stacks[0].Outputs.find((f) => f.OutputKey === 'CloudFrontDomain');

    const cloudFrontDistributions = await cloudFront.listDistributions().promise();
    const cf = cloudFrontDistributions.DistributionList?.Items?.find(
        (f) => f.DomainName === cloudFrontDomain?.OutputValue,
    );

    if (cloudFrontDomain == null || cf == null) {
        LogConfig.get().warn('Unable to find cloud front distribution');
        return;
    }

    LogConfig.get().info({ path, cfId: cf.Id }, 'Invalidating');
    if (commit) {
        await cloudFront
            .createInvalidation({
                DistributionId: cf.Id,
                InvalidationBatch: {
                    Paths: { Quantity: 1, Items: [path] },
                    CallerReference: `${CliId}-${InvalidationId++}`,
                },
            })
            .promise();
    }
}

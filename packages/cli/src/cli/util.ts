import { LogConfig } from '@basemaps/shared';
import * as AWS from 'aws-sdk';
import { CliId } from './base.cli';

// Coudfront has to be defined in us-east-1
const cloudFormation = new AWS.CloudFormation({ region: 'us-east-1' });
const cloudFront = new AWS.CloudFront({ region: 'us-east-1' });

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
    const cloudFrontDomain = stackInfo.Stacks[0].Outputs.find((f) => f.OutputKey == 'CloudFrontDomain');

    const cloudFrontDistributions = await cloudFront.listDistributions().promise();
    const cf = cloudFrontDistributions.DistributionList?.Items?.find(
        (f) => f.DomainName == cloudFrontDomain?.OutputValue,
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

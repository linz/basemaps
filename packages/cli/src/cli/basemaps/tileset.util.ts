import { EPSG } from '@basemaps/geo';
import {
    Aws,
    LogConfig,
    TileMetadataImageryRecord,
    TileMetadataSetRecord,
    TileSetRuleImagery,
    TileSetTag,
} from '@basemaps/lambda-shared';
import * as AWS from 'aws-sdk';
import * as c from 'chalk';
import * as chalk from 'chalk';
import { CliId } from '../base.cli';
import { CliTable } from '../cli.table';

export const TileSetTable = new CliTable<TileSetRuleImagery>();
TileSetTable.field('#', 4, (obj) => String(obj.rule.priority));
TileSetTable.field('Id', 30, (obj) => c.dim(obj.rule.id));
TileSetTable.field('Name', 40, (obj) => obj.imagery.name);
TileSetTable.field('Zoom', 10, (obj) => obj.rule.minZoom + ' -> ' + obj.rule.maxZoom);
TileSetTable.field('CreatedAt', 10, (obj) => new Date(obj.imagery.createdAt).toISOString());

export async function printTileSetImagery(tsData: TileMetadataSetRecord): Promise<void> {
    TileSetTable.print(await Aws.tileMetadata.Imagery.getAll(tsData));
}

export async function printTileSet(tsData: TileMetadataSetRecord, printImagery = true): Promise<void> {
    console.log(c.bold('TileSet:'), `${tsData.name} `);
    console.log(c.bold('CreatedAt:'), new Date(tsData.createdAt).toISOString());
    console.log(c.bold('UpdatedAt:'), new Date(tsData.updatedAt).toISOString());
    console.log(c.bold('Version:'), `v${tsData.version}`);
    if (tsData.background) {
        console.log(c.bold('Background'), tsData.background);
    }

    if (printImagery) await printTileSetImagery(tsData);
}

export function showDiff(
    tsA: TileMetadataSetRecord,
    tsB: TileMetadataSetRecord,
    imageSet: Map<string, TileMetadataImageryRecord>,
): string {
    let output = '';
    for (const tsAImg of Object.values(tsA.imagery)) {
        const tsBImg = tsB.imagery[tsAImg.id];
        const imagery = imageSet.get(tsAImg.id)!;
        const lineA = TileSetTable.line({ rule: tsAImg, imagery });

        if (tsBImg == null) {
            output += chalk.green('\t+', lineA) + '\n';
            continue;
        }

        const lineB = TileSetTable.line({ rule: tsBImg, imagery });
        if (lineA !== lineB) {
            output += chalk.green('\t+', lineA) + '\n';
            output += chalk.red('\t-', lineB) + '\n';
        }
    }

    for (const tsBImg of Object.values(tsB.imagery)) {
        const tsAImg = tsA.imagery[tsBImg.id];
        const imagery = imageSet.get(tsBImg.id)!;

        if (tsAImg == null) {
            const lineA = TileSetTable.line({ rule: tsBImg, imagery });
            output += chalk.red('\t-', lineA) + '\n';
        }
    }
    return output;
}

// Coudfront has to be defined in us-east-1
const cloudFormation = new AWS.CloudFormation({ region: 'us-east-1' });
const cloudFront = new AWS.CloudFront({ region: 'us-east-1' });

/**
 * Invalidate the cloudfront distribution cache when updating imagery sets
 */
export async function invalidateCache(name: string, projection: EPSG, tag: TileSetTag, commit = false): Promise<void> {
    const nameStr = tag == TileSetTag.Production ? name : `${name}@${tag}`;
    const path = `/v1/tiles/${nameStr}/${projection}/*`;

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
                InvalidationBatch: { Paths: { Quantity: 1, Items: [path] }, CallerReference: CliId },
            })
            .promise();
    }
}

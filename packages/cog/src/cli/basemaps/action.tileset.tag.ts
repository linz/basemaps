/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Aws, LogConfig, TileSetTag } from '@basemaps/lambda-shared';
import {
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { TileSetBaseAction } from './tileset.action';
import * as AWS from 'aws-sdk';
import { EPSG } from '@basemaps/geo';

// Coudfront has to be defined in us-east-1
const cloudFormation = new AWS.CloudFormation({ region: 'us-east-1' });
const cloudFront = new AWS.CloudFront({ region: 'us-east-1' });

export class TileSetUpdateTagAction extends TileSetBaseAction {
    private version: CommandLineIntegerParameter;
    private tag: CommandLineStringParameter;
    private commit: CommandLineFlagParameter;

    public constructor() {
        super({
            actionName: 'tag',
            summary: 'Tag a version for rendering',
            documentation: 'Get rendering information for the tile set or imagery',
        });
    }

    protected onDefineParameters(): void {
        super.onDefineParameters();

        this.version = this.defineIntegerParameter({
            argumentName: 'VERSION',
            parameterLongName: '--version',
            parameterShortName: '-v',
            description: 'Version ID',
            required: false,
        });

        const validTags = Object.values(TileSetTag).filter((f) => f != TileSetTag.Head);
        this.tag = this.defineStringParameter({
            argumentName: 'TILE_SET',
            parameterLongName: '--tag',
            parameterShortName: '-t',
            description: `tag name  (options: ${validTags.join(', ')})`,
            required: false,
        });

        this.commit = this.defineFlagParameter({
            parameterLongName: '--commit',
            description: 'Commit to database',
            required: false,
        });
    }

    protected async onExecute(): Promise<void> {
        const tileSet = this.tileSet.value!;
        const projection = this.projection.value!;
        const tagInput = this.tag.value!;
        const version = this.version.value!;

        const { tag, name } = Aws.tileMetadata.TileSet.parse(`${tileSet}@${tagInput}`);
        if (tag == null) {
            LogConfig.get().fatal({ tag }, 'Invalid tag name');
            console.log(this.renderHelpText());
            return;
        }

        LogConfig.get().info({ version, tag, name, projection }, 'Tagging');

        if (this.commit.value) {
            await Aws.tileMetadata.TileSet.tag(name, projection, tag, version);
        }
        await this.invalidateCache(name, projection, tag);

        if (!this.commit.value) {
            LogConfig.get().warn('DryRun:Done');
        }
    }

    async invalidateCache(name: string, projection: EPSG, tag: TileSetTag): Promise<void> {
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
        if (this.commit.value) {
            await cloudFront
                .createInvalidation({
                    DistributionId: cf.Id,
                    InvalidationBatch: { Paths: { Quantity: 1, Items: [path] }, CallerReference: this.id },
                })
                .promise();
        }
    }
}

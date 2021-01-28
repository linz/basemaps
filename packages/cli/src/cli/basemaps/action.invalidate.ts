/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Epsg } from '@basemaps/geo';
import { Aws, LogConfig, TileMetadataNamedTag } from '@basemaps/shared';
import {
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { TagAction } from '../tag.action';
import { TileSetBaseAction } from './tileset.action';
import { invalidateXYZCache } from './tileset.util';

export class TileSetInvalidateTagAction extends TileSetBaseAction {
    private version: CommandLineIntegerParameter;
    private tag: CommandLineStringParameter;
    private commit: CommandLineFlagParameter;

    public constructor() {
        super({
            actionName: 'invalidate',
            summary: 'Invalidate basemaps caches rendering',
            documentation: 'Destroy the cache for cloudfront, useful if all the tiles need to be rendered again',
        });
    }

    protected onDefineParameters(): void {
        super.onDefineParameters();
        TagAction.onDefineParameters(this);
    }

    protected async onExecute(): Promise<void> {
        const tileSet = this.tileSet.value!;
        const projection = Epsg.tryGet(this.projection.value!);
        if (projection == null) return this.fatal({ projection: this.projection.value }, 'Invalid projection');

        const tagInput = this.tag.value!;
        const version = this.version.value!;

        const tileSetName = `${tileSet}@${tagInput}`;
        const { tag, name } = Aws.tileMetadata.TileSet.parse(tileSetName);
        if (tag == null) return this.fatal({ tag }, 'Invalid tag name');

        const tsData = await Aws.tileMetadata.TileSet.get(name, projection, tag);
        if (tsData == null) return this.fatal({ tileSet: tileSetName }, 'Could not find tileset');

        LogConfig.get().info({ version, tag, name, projection }, 'Invalidating');

        if (tag == TileMetadataNamedTag.Production) LogConfig.get().warn('Invaliding production cache');

        if (this.commit.value) {
            await invalidateXYZCache(name, projection, tag, this.commit.value);
        } else {
            LogConfig.get().warn('DryRun:Done');
        }
    }
}

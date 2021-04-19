/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { TileSetNameParser } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';
import { Config, LogConfig } from '@basemaps/shared';
import {
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { TagActions } from '../tag.action';
import { TileSetBaseAction } from './tileset.action';
import { invalidateXYZCache } from './tileset.util';

export class TileSetInvalidateTagAction extends TileSetBaseAction {
    private commit: CommandLineFlagParameter;
    private projection: CommandLineIntegerParameter;
    private tag: CommandLineStringParameter;
    private tileSet: CommandLineStringParameter;

    public constructor() {
        super({
            actionName: 'invalidate',
            summary: 'Invalidate basemaps caches rendering',
            documentation: 'Destroy the cache for cloudfront, useful if all the tiles need to be rendered again',
        });
    }

    protected onDefineParameters(): void {
        this.commit = this.defineFlagParameter(TagActions.Commit);
        this.projection = this.defineIntegerParameter(TagActions.Projection);
        this.tag = this.defineStringParameter(TagActions.Tag);
        this.tileSet = this.defineStringParameter(TagActions.TileSet);
    }

    protected async onExecute(): Promise<void> {
        const tileSet = this.tileSet.value!;
        const projection = Epsg.tryGet(this.projection.value!);
        if (projection == null) return this.fatal({ projection: this.projection.value }, 'Invalid projection');

        const tagInput = this.tag.value!;

        const tileSetName = TileSetNameParser.toName(tileSet, tagInput);
        const { tag, name } = TileSetNameParser.parse(tileSetName);
        if (tag == null) return this.fatal({ tag }, 'Invalid tag name');

        const tsData = await Config.TileSet.get(Config.TileSet.id(name, tag));
        if (tsData == null) return this.fatal({ tileSet: tileSetName }, 'Could not find tileset');

        LogConfig.get().info({ tag, name, projection }, 'Invalidating');

        if (tag === Config.Tag.Production) LogConfig.get().warn('Invaliding production cache');

        if (this.commit.value) {
            await invalidateXYZCache(name, projection, tag, this.commit.value);
        } else {
            LogConfig.get().warn('DryRun:Done');
        }
    }
}

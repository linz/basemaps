/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Epsg } from '@basemaps/geo';
import { Config, LogConfig } from '@basemaps/shared';
import {
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { TagActions } from '../tag.action.js';
import { TileSetBaseAction } from './tileset.action.js';
import { invalidateXYZCache } from './tileset.util.js';

export class TileSetInvalidateAction extends TileSetBaseAction {
    private commit: CommandLineFlagParameter;
    private projection: CommandLineIntegerParameter;
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
        this.tileSet = this.defineStringParameter(TagActions.TileSet);
    }

    protected async onExecute(): Promise<void> {
        const tileSet = this.tileSet.value!;
        const projection = Epsg.tryGet(this.projection.value!);
        if (projection == null) return this.fatal({ projection: this.projection.value }, 'Invalid projection');

        const tsData = await Config.TileSet.get(Config.TileSet.id(tileSet));
        if (tsData == null) return this.fatal({ tileSet }, 'Could not find tileset');

        LogConfig.get().info({ tileSet, projection }, 'Invalidating');

        if (this.commit.value) {
            await invalidateXYZCache(tileSet, projection, this.commit.value);
        } else {
            LogConfig.get().warn('DryRun:Done');
        }
    }
}

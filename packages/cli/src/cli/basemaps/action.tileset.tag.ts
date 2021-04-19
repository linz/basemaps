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

export class TileSetUpdateTagAction extends TileSetBaseAction {
    private commit: CommandLineFlagParameter;
    private projection: CommandLineIntegerParameter;
    private tag: CommandLineStringParameter;
    private tileSet: CommandLineStringParameter;
    private version: CommandLineIntegerParameter;

    public constructor() {
        super({
            actionName: 'tag',
            summary: 'Tag a version for rendering',
            documentation: 'Get rendering information for the tile set or imagery',
        });
    }

    protected onDefineParameters(): void {
        this.commit = this.defineFlagParameter(TagActions.Commit);
        this.projection = this.defineIntegerParameter(TagActions.Projection);
        this.tag = this.defineStringParameter(TagActions.Tag);
        this.tileSet = this.defineStringParameter(TagActions.TileSet);
        this.version = this.defineIntegerParameter(TagActions.Version);
    }

    protected async onExecute(): Promise<void> {
        const tileSetName = this.tileSet.value!;
        const projection = Epsg.tryGet(this.projection.value!);
        if (projection == null) return this.fatal({ projection: this.projection.value }, 'Invalid projection');

        const tagInput = this.tag.value!;
        const version = this.version.value!;

        const { tag, name } = TileSetNameParser.parse(`${tileSetName}@${tagInput}`);
        if (tag == null) return this.fatal({ tag }, 'Invalid tag name');

        LogConfig.get().info({ version, tag, name, projection }, 'Tagging');

        const tileSetId = Config.TileSet.id({ name, projection }, version);
        const tileSet = await Config.TileSet.get(tileSetId);
        if (tileSet == null) throw new Error(`Cannot find tile set ${tileSetId}`);
        if (this.commit.value) {
            await Config.TileSet.tag(tileSet, tag);
            await invalidateXYZCache(name, projection, tag, this.commit.value);
        }

        if (!this.commit.value) {
            LogConfig.get().warn('DryRun:Done');
        }
    }
}

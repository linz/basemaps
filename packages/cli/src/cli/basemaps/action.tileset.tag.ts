/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Epsg } from '@basemaps/geo';
import { Aws, LogConfig, TileSetNameParser } from '@basemaps/shared';
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
        const tileSet = this.tileSet.value!;
        const projection = Epsg.tryGet(this.projection.value!);
        if (projection == null) return this.fatal({ projection: this.projection.value }, 'Invalid projection');

        const tagInput = this.tag.value!;
        const version = this.version.value!;

        const { tag, name } = TileSetNameParser.parse(`${tileSet}@${tagInput}`);
        if (tag == null) return this.fatal({ tag }, 'Invalid tag name');

        LogConfig.get().info({ version, tag, name, projection }, 'Tagging');

        if (this.commit.value) {
            await Aws.tileMetadata.TileSet.tag(name, projection, tag, version);
            await invalidateXYZCache(name, projection, tag, this.commit.value);
        }

        if (!this.commit.value) {
            LogConfig.get().warn('DryRun:Done');
        }
    }
}

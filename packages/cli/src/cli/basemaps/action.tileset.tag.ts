/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Aws, LogConfig } from '@basemaps/lambda-shared';
import {
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { TagAction } from '../tag.action';
import { TileSetBaseAction } from './tileset.action';
import { invalidateXYZCache } from './tileset.util';
import { Epsg } from '@basemaps/geo';

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
        TagAction.onDefineParameters(this);
    }

    protected async onExecute(): Promise<void> {
        const tileSet = this.tileSet.value!;
        const projection = Epsg.get(this.projection.value!);

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
            await invalidateXYZCache(name, projection, tag, this.commit.value);
        }

        if (!this.commit.value) {
            LogConfig.get().warn('DryRun:Done');
        }
    }
}

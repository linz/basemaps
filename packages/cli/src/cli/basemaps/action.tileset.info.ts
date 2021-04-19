/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Epsg } from '@basemaps/geo';
import { Config, LogConfig } from '@basemaps/shared';
import { CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import * as c from 'ansi-colors';
import { TagActions } from '../tag.action';
import { TileSetBaseAction } from './tileset.action';
import { printTileSet } from './tileset.util';

export class TileSetInfoAction extends TileSetBaseAction {
    private imagery: CommandLineStringParameter;
    private projection: CommandLineIntegerParameter;
    private tileSet: CommandLineStringParameter;
    private version: CommandLineIntegerParameter;

    public constructor() {
        super({
            actionName: 'info',
            summary: 'Rendering information for tile sets or imagery',
            documentation: 'Get rendering information for the tile set or imagery',
        });
    }

    protected onDefineParameters(): void {
        this.imagery = this.defineStringParameter(TagActions.Imagery);
        this.projection = this.defineIntegerParameter(TagActions.Projection);
        this.tileSet = this.defineStringParameter(TagActions.TileSet);
        this.version = this.defineIntegerParameter(TagActions.Version);
    }

    private async imageInfo(imageryId: string): Promise<void> {
        const img = await Config.Imagery.get(imageryId);
        if (img == null) throw new Error('Cannot find imagery with id ' + imageryId);

        console.log(c.bold('Imagery:'), img.name);
        console.log(c.bold('CreatedAt:'), new Date(img.createdAt).toString());
        console.log(c.bold('UpdatedAt:'), new Date(img.updatedAt).toString());
        console.log(c.bold('Year:'), img.year);
        console.log(c.bold('Projection:'), img.projection);
        console.log(c.bold('Resolution:'), img.resolution);
        console.log(c.bold('Files:\n'), img.files.map((c) => `\t${c.name}`).join('\n'));
        // TODO get job.json from s3 and get information on how the imagery was made.
    }

    protected async onExecute(): Promise<void> {
        const tileSet = this.tileSet.value;
        const projection = Epsg.tryGet(this.projection.value!);
        if (projection == null) return this.fatal({ projection: this.projection.value }, 'Invalid projection');

        const imgId = this.imagery.value;
        if (imgId != null) return this.imageInfo(imgId);

        if (tileSet == null) {
            LogConfig.get().fatal('Missing --tileset and --projection or --imagery');
            console.log(this.renderHelpText());
            return;
        }
        const tileSetId = Config.TileSet.id(tileSet, this.version.value! ?? Config.Tag.Head);
        const tsData = await Config.TileSet.get(tileSetId);

        if (tsData == null) {
            LogConfig.get().fatal({ tileSet }, 'Unable to find tile set');
            return;
        }

        await printTileSet(tsData, projection);
    }
}

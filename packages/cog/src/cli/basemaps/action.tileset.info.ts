/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Aws, LogConfig } from '@basemaps/lambda-shared';
import { CommandLineAction, CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { printTileSet } from './tileset.util';
import { EPSG } from '@basemaps/geo';
import * as c from 'chalk';

export class TileSetInfoAction extends CommandLineAction {
    private tileSet: CommandLineStringParameter;
    private projection: CommandLineIntegerParameter;
    private imagery: CommandLineStringParameter;

    public constructor() {
        super({
            actionName: 'info',
            summary: 'Rendering information for tile sets or imagery',
            documentation: 'Get rendering information for the tile set or imagery',
        });
    }

    protected onDefineParameters(): void {
        this.tileSet = this.defineStringParameter({
            argumentName: 'TILE_SET',
            parameterLongName: '--tileset',
            parameterShortName: '-t',
            description: 'Tileset name to use',
            required: false,
        });

        this.projection = this.defineIntegerParameter({
            argumentName: 'PROJECTION',
            parameterLongName: '--projection',
            parameterShortName: '-p',
            description: 'Projection to use',
            required: false,
        });

        this.imagery = this.defineStringParameter({
            argumentName: 'IMAGERY',
            parameterLongName: '--imagery',
            parameterShortName: '-i',
            description: 'Imagery ID',
            required: false,
        });
    }

    private async imageInfo(imageryId: string): Promise<void> {
        const img = await Aws.tileMetadata.db.getImagery(imageryId);

        console.log(c.bold('Imagery:'), img.name);
        console.log(c.bold('CreatedAt:'), new Date(img.createdAt).toString());
        console.log(c.bold('UpdatedAt:'), new Date(img.updatedAt).toString());
        console.log(c.bold('Year:'), img.year);
        console.log(c.bold('Projection:'), img.projection);
        console.log(c.bold('Resolution:'), img.resolution);
        console.log(c.bold('QuadKeys:\n'), img.quadKeys.map((c) => `\t${c}`).join('\n'));
        // TODO get job.json from s3 and get information on how the imagery was made.
    }

    private async tileSetInfo(tileSet: string, projection: EPSG): Promise<void> {
        const tsData = await Aws.tileMetadata.db.getTileSet(tileSet, projection);

        if (tsData == null) {
            LogConfig.get().fatal({ tileSet, projection }, 'Failed to find tile set');
            process.exit(1);
        }
        await printTileSet(tsData);
    }
    protected async onExecute(): Promise<void> {
        const tileSet = this.tileSet.value!;
        const projection = this.projection.value!;
        const imgId = this.imagery.value!;

        if (imgId != null) return this.imageInfo(imgId);

        if (tileSet == null || projection == null) {
            LogConfig.get().fatal('Missing --tileset and --projection or --imagery');
            console.log(this.renderHelpText());
            return;
        }
        this.tileSetInfo(tileSet, projection);
    }
}

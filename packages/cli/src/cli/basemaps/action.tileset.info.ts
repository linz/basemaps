/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Aws, LogConfig, TileMetadataTag } from '@basemaps/lambda-shared';
import { CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import * as c from 'ansi-colors';
import { TileSetBaseAction } from './tileset.action';
import { printTileSet } from './tileset.util';
import { Epsg } from '@basemaps/geo';

export class TileSetInfoAction extends TileSetBaseAction {
    private imagery: CommandLineStringParameter;
    private version: CommandLineIntegerParameter;

    public constructor() {
        super({
            actionName: 'info',
            summary: 'Rendering information for tile sets or imagery',
            documentation: 'Get rendering information for the tile set or imagery',
        });
    }

    protected onDefineParameters(): void {
        super.onDefineParameters();
        this.imagery = this.defineStringParameter({
            argumentName: 'IMAGERY',
            parameterLongName: '--imagery',
            parameterShortName: '-i',
            description: 'Imagery ID',
            required: false,
        });

        this.version = this.defineIntegerParameter({
            argumentName: 'VERSION',
            parameterLongName: '--version',
            parameterShortName: '-v',
            description: 'Version ID',
            required: false,
        });
    }

    private async imageInfo(imageryId: string): Promise<void> {
        const img = await Aws.tileMetadata.Imagery.get(imageryId);

        console.log(c.bold('Imagery:'), img.name);
        console.log(c.bold('CreatedAt:'), new Date(img.createdAt).toString());
        console.log(c.bold('UpdatedAt:'), new Date(img.updatedAt).toString());
        console.log(c.bold('Year:'), img.year);
        console.log(c.bold('Projection:'), img.projection);
        console.log(c.bold('Resolution:'), img.resolution);
        console.log(c.bold('QuadKeys:\n'), img.quadKeys.map((c) => `\t${c}`).join('\n'));
        // TODO get job.json from s3 and get information on how the imagery was made.
    }

    protected async onExecute(): Promise<void> {
        const tileSet = this.tileSet.value!;
        const projection = Epsg.get(this.projection.value!);
        const imgId = this.imagery.value!;

        if (imgId != null) return this.imageInfo(imgId);

        if (tileSet == null || projection == null) {
            LogConfig.get().fatal('Missing --tileset and --projection or --imagery');
            console.log(this.renderHelpText());
            return;
        }
        const tsData = await Aws.tileMetadata.TileSet.get(
            tileSet,
            projection,
            this.version.value! ?? TileMetadataTag.Head,
        );
        await printTileSet(tsData);
    }
}

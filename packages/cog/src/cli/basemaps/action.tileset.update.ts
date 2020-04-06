/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Aws, LogConfig, TileMetadataSetRecord } from '@basemaps/lambda-shared';
import {
    CommandLineAction,
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { printTileSet } from './tileset.util';

export class TileSetUpdateAction extends CommandLineAction {
    private tileSet: CommandLineStringParameter;
    private projection: CommandLineIntegerParameter;
    private priority: CommandLineIntegerParameter;
    private imageryId: CommandLineStringParameter;
    private commit: CommandLineFlagParameter;

    private minZoom: CommandLineIntegerParameter;
    private maxZoom: CommandLineIntegerParameter;

    public constructor() {
        super({
            actionName: 'update',
            summary: 'Update rendering information for a tileset',
            documentation: 'Configure how the rendering engine processes a tileset',
        });
    }

    protected onDefineParameters(): void {
        this.tileSet = this.defineStringParameter({
            argumentName: 'TILE_SET',
            parameterLongName: '--tileset',
            parameterShortName: '-t',
            description: 'Tileset name to use',
            required: true,
        });

        this.projection = this.defineIntegerParameter({
            argumentName: 'PROJECTION',
            parameterLongName: '--projection',
            parameterShortName: '-p',
            description: 'Projection to use',
            required: true,
        });

        this.imageryId = this.defineStringParameter({
            argumentName: 'IMAGERY',
            parameterLongName: '--imagery',
            parameterShortName: '-i',
            description: 'Imagery ID',
            required: true,
        });

        this.priority = this.defineIntegerParameter({
            argumentName: 'PRIORITY',
            parameterLongName: '--priority',
            description: 'Render priority (-1 to remove)',
            required: false,
        });

        this.minZoom = this.defineIntegerParameter({
            argumentName: 'MIN_ZOOM',
            parameterLongName: '--min-zoom',
            description: 'Minimum zoom to render',
            required: false,
        });

        this.maxZoom = this.defineIntegerParameter({
            argumentName: 'MAX_ZOOM',
            parameterLongName: '--max-zoom',
            description: 'Maximum zoom to render at',
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
        const imgId = this.imageryId.value!;

        const tsData = await Aws.tileMetadata.db.getTileSet(tileSet, projection);

        if (tsData == null) {
            LogConfig.get().fatal({ tileSet, projection }, 'Failed to find tile set');
            process.exit(1);
        }

        await Aws.tileMetadata.db.getAllImagery(tsData);

        const priorityUpdate = await this.updatePriority(tsData, imgId);
        const zoomUpdate = await this.updateZoom(tsData, imgId);

        await printTileSet(tsData);

        if (priorityUpdate || zoomUpdate) {
            if (this.commit.value) {
                await Aws.tileMetadata.db.create(tsData);
            } else {
                LogConfig.get().warn('DryRun:Done');
            }
        } else {
            LogConfig.get().info('No Changes');
        }
    }

    async updateZoom(tsData: TileMetadataSetRecord, imgId: string): Promise<boolean> {
        const existing = tsData.imagery.find((f) => f.id == imgId);
        if (existing == null) return false;

        const minZoom = this.minZoom.value;
        const maxZoom = this.maxZoom.value;
        if (minZoom == null || maxZoom == null) return false;
        if (existing.maxZoom == maxZoom && existing.minZoom == minZoom) {
            return false;
        }
        const logger = LogConfig.get();

        const img = await Aws.tileMetadata.db.getImagery(imgId);

        logger.info(
            {
                imgId,
                imagery: img?.name,
                fromZoom: { min: existing.minZoom, max: existing.maxZoom },
                toZoom: { min: minZoom, max: maxZoom },
            },
            'ChangeZoom',
        );

        existing.minZoom = minZoom;
        existing.maxZoom = maxZoom;
        return true;
    }

    async updatePriority(tsData: TileMetadataSetRecord, imgId: string): Promise<boolean> {
        const logger = LogConfig.get();

        const priority = this.priority.value!;
        if (priority == null) return false;

        const existingIndex = tsData.imagery.findIndex((f) => f.id == imgId);

        if (priority == -1) {
            // Remove imagery
            if (existingIndex == -1) throw new Error('Failed to find imagery: ' + imgId);
            tsData.imagery.splice(existingIndex, 1);
            const img = await Aws.tileMetadata.db.getImagery(imgId);

            logger.info({ imgId, imagery: img?.name, priority: existingIndex + 1 }, 'Removing Imagery');
            return true;
        }

        if (existingIndex == -1) {
            // Add new imagery
            logger.info({ imgId, priority }, 'Add imagery');
            const img = await Aws.tileMetadata.db.getImagery(imgId);
            logger.info({ imgId, imagery: img.name, priority }, 'Adding');
            tsData.imagery.splice(priority + 1, 0, {
                id: imgId,
                minZoom: this.minZoom.value ?? 0,
                maxZoom: this.maxZoom.value ?? 32,
            });
            return true;
        }

        if (existingIndex + 1 !== priority) {
            // Update
            const img = await Aws.tileMetadata.db.getImagery(imgId);
            logger.info(
                { imgId, imagery: img?.name, oldPriority: existingIndex + 1, newPriority: priority },
                'Update Priority',
            );
            const oldRecord = tsData.imagery.splice(existingIndex, 1);
            tsData.imagery.splice(priority - 1, 0, ...oldRecord);
            return true;
        }

        return false;
    }
}

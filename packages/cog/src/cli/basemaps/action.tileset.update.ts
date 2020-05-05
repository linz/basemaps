/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Aws, LogConfig, TileMetadataSetRecord, TileSetTag } from '@basemaps/lambda-shared';
import {
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { TileSetBaseAction } from './tileset.action';
import { printTileSet } from './tileset.util';

export class TileSetUpdateAction extends TileSetBaseAction {
    priority: CommandLineIntegerParameter;
    imageryId: CommandLineStringParameter;
    commit: CommandLineFlagParameter;

    minZoom: CommandLineIntegerParameter;
    maxZoom: CommandLineIntegerParameter;

    public constructor() {
        super({
            actionName: 'update',
            summary: 'Update rendering information for a tileset',
            documentation: 'Configure how the rendering engine processes a tileset',
        });
    }

    protected onDefineParameters(): void {
        super.onDefineParameters();

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

        const tsData = await Aws.tileMetadata.TileSet.get(tileSet, projection, TileSetTag.Head);

        if (tsData == null) {
            LogConfig.get().fatal({ tileSet, projection }, 'Failed to find tile set');
            process.exit(1);
        }

        await Aws.tileMetadata.Imagery.getAll(tsData);

        const priorityUpdate = await this.updatePriority(tsData, imgId);
        const zoomUpdate = await this.updateZoom(tsData, imgId);

        await printTileSet(tsData);

        if (priorityUpdate || zoomUpdate) {
            if (this.commit.value) {
                await Aws.tileMetadata.TileSet.create(tsData);
            } else {
                LogConfig.get().warn('DryRun:Done');
            }
        } else {
            LogConfig.get().info('No Changes');
        }
    }

    async updateZoom(tsData: TileMetadataSetRecord, imgId: string): Promise<boolean> {
        const existing = tsData.imagery[imgId];
        if (existing == null) return false;

        const minZoom = this.minZoom.value;
        const maxZoom = this.maxZoom.value;
        if (minZoom == null || maxZoom == null) return false;
        if (existing.maxZoom == maxZoom && existing.minZoom == minZoom) {
            return false;
        }
        const logger = LogConfig.get();

        const img = await Aws.tileMetadata.Imagery.get(imgId);

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

        const existing = tsData.imagery[imgId];

        if (priority == -1) {
            // Remove imagery
            if (existing == null) throw new Error('Failed to find imagery: ' + imgId);
            delete tsData.imagery[imgId];
            const img = await Aws.tileMetadata.Imagery.get(imgId);

            logger.info({ imgId, imagery: img?.name, priority: existing.priority }, 'Removing Imagery');
            return true;
        }

        if (existing == null) {
            // Add new imagery
            logger.info({ imgId, priority }, 'Add imagery');
            const img = await Aws.tileMetadata.Imagery.get(imgId);
            logger.info({ imgId, imagery: img.name, priority }, 'Adding');
            tsData.imagery[imgId] = {
                id: imgId,
                minZoom: this.minZoom.value ?? 0,
                maxZoom: this.maxZoom.value ?? 32,
                priority,
            };
            return true;
        }

        if (existing.priority !== priority) {
            // Update
            const img = await Aws.tileMetadata.Imagery.get(imgId);
            logger.info(
                { imgId, imagery: img?.name, oldPriority: existing.priority, newPriority: priority },
                'Update Priority',
            );
            existing.priority = priority;
            return true;
        }

        return false;
    }
}

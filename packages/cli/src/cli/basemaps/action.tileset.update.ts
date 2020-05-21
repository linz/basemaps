/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
    Aws,
    LogConfig,
    RecordPrefix,
    TileMetadataSetRecord,
    TileMetadataTable,
    TileMetadataTag,
} from '@basemaps/lambda-shared';
import {
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { readFileSync } from 'fs';
import { TileSetBaseAction } from './tileset.action';
import { invalidateXYZCache, printTileSet } from './tileset.util';

/**
 * Parse a string as hex, return 0 on failure
 * @param str string to parse
 */
function parseHex(str: string): number {
    if (str == '') return 0;
    const val = parseInt(str, 16);
    if (isNaN(val)) return 0;
    return val;
}
/**
 * Parse a hexstring into RGBA
 *
 * Defaults to 0 if missing values
 * @param str string to parse
 */
export function parseRgba(str: string): { r: number; g: number; b: number; alpha: number } {
    if (str.startsWith('0x')) str = str.slice(2);
    return {
        r: parseHex(str.substr(0, 2)),
        g: parseHex(str.substr(2, 2)),
        b: parseHex(str.substr(4, 2)),
        alpha: parseHex(str.substr(6, 2)),
    };
}

export class TileSetUpdateAction extends TileSetBaseAction {
    priority: CommandLineIntegerParameter;
    imageryId: CommandLineStringParameter;
    commit: CommandLineFlagParameter;
    replaceImageryId: CommandLineStringParameter;

    title: CommandLineStringParameter;
    description: CommandLineStringParameter;
    background: CommandLineStringParameter;
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
            required: false,
        });

        this.priority = this.defineIntegerParameter({
            argumentName: 'PRIORITY',
            parameterLongName: '--priority',
            description: 'Render priority (-1 to remove)',
            required: false,
        });

        this.title = this.defineStringParameter({
            argumentName: 'TITLE',
            parameterLongName: '--title',
            description: 'Imagery title',
            required: false,
        });

        this.description = this.defineStringParameter({
            argumentName: 'DESCRIPTION',
            parameterLongName: '--description',
            description: 'Path to file containing imagery description',
            required: false,
        });

        this.background = this.defineStringParameter({
            argumentName: 'BACKGROUND',
            parameterLongName: '--background',
            description: 'background color',
            required: false,
        });

        this.replaceImageryId = this.defineStringParameter({
            argumentName: 'REPLACE_WITH',
            parameterLongName: '--replace-with',
            description: 'Replace the current imagery with a new imagery set',
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
        const name = this.tileSet.value!;
        const projection = this.projection.value!;
        const imgId = TileMetadataTable.prefix(RecordPrefix.Imagery, this.imageryId.value ?? '');

        const tsData = await Aws.tileMetadata.TileSet.get(name, projection, TileMetadataTag.Head);

        if (tsData == null) {
            LogConfig.get().fatal({ tileSet: name, projection }, 'Failed to find tile set');
            process.exit(1);
        }
        const before = JSON.stringify(tsData);
        await Aws.tileMetadata.Imagery.getAll(tsData);

        if (imgId) {
            await this.updatePriority(tsData, imgId);
            await this.updateZoom(tsData, imgId);
            await this.replaceUpdate(tsData, imgId);
        }

        this.updateTile(tsData);
        this.updateDescription(tsData);
        this.updateBackground(tsData);
        const after = JSON.stringify(tsData);

        await printTileSet(tsData);

        if (before != after) {
            if (this.commit.value) {
                await Aws.tileMetadata.TileSet.create(tsData);
                await invalidateXYZCache(name, projection, TileMetadataTag.Head, this.commit.value);
            } else {
                LogConfig.get().warn('DryRun:Done');
            }
        } else {
            LogConfig.get().info('No Changes');
        }
    }

    updateTile(tsData: TileMetadataSetRecord): boolean {
        const existing = tsData.title;
        const title = this.title.value;
        if (title == null || title === existing) return false;
        tsData.title = title;
        return true;
    }

    updateDescription(tsData: TileMetadataSetRecord): boolean {
        const existing = tsData.description;
        const descriptionPath = this.description.value;
        if (descriptionPath == null) return false;
        const description = readFileSync(descriptionPath).toString().trim();
        if (description == null || description === existing) return false;
        tsData.description = description;
        return true;
    }

    updateBackground(tsData: TileMetadataSetRecord): boolean {
        const existing = tsData.background;
        const background = this.background.value;
        if (background == null) return false;
        const rgba = parseRgba(background);
        if (rgba.r != existing?.r || rgba.g != existing?.g || rgba.b != existing?.b || rgba.alpha != existing?.alpha) {
            tsData.background = rgba;
            return true;
        }

        return false;
    }

    async replaceUpdate(tsData: TileMetadataSetRecord, imgId: string): Promise<boolean> {
        const existing = tsData.imagery[imgId];
        if (existing == null) return false;

        const replaceId = TileMetadataTable.prefix(RecordPrefix.Imagery, this.replaceImageryId.value ?? '');
        if (replaceId == '') return false;
        if (tsData.imagery[replaceId] != null) {
            LogConfig.get().warn({ replaceId }, 'Replacement already exists');
            return false;
        }

        const img = await Aws.tileMetadata.Imagery.get(replaceId);

        LogConfig.get().info({ imgId, imagery: img?.name }, 'Replace');
        delete tsData.imagery[imgId];

        tsData.imagery[replaceId] = { ...existing, id: replaceId };
        return true;
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

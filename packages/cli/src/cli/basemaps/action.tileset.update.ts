/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Epsg } from '@basemaps/geo';
import {
    Aws,
    LogConfig,
    RecordPrefix,
    TileMetadataNamedTag,
    TileMetadataSetRecord,
    TileMetadataTable,
    TileResizeKernel,
} from '@basemaps/shared';
import {
    CommandLineFlagParameter,
    CommandLineIntegerParameter,
    CommandLineStringParameter,
} from '@rushstack/ts-command-line';
import { promises as fs } from 'fs';
import { ulid } from 'ulid';
import { TagActions } from '../tag.action';
import { TileSetBaseAction } from './tileset.action';
import { invalidateXYZCache, parseRgba, printTileSet } from './tileset.util';

export const ResizeKernels = ['lanczos3', 'lanczos2', 'nearest'];

export class TileSetUpdateAction extends TileSetBaseAction {
    priority: CommandLineIntegerParameter;
    ruleId: CommandLineStringParameter;
    imageryId: CommandLineStringParameter;
    commit: CommandLineFlagParameter;

    title: CommandLineStringParameter;
    description: CommandLineStringParameter;
    background: CommandLineStringParameter;
    minZoom: CommandLineIntegerParameter;
    maxZoom: CommandLineIntegerParameter;

    resizeIn: CommandLineStringParameter;
    resizeOut: CommandLineStringParameter;
    projection: CommandLineIntegerParameter;
    tileSet: CommandLineStringParameter;

    public constructor() {
        super({
            actionName: 'update',
            summary: 'Update rendering information for a tileset',
            documentation: 'Configure how the rendering engine processes a tileset',
        });
    }

    protected onDefineParameters(): void {
        this.ruleId = this.defineStringParameter({
            argumentName: 'RULE',
            parameterLongName: '--rule',
            parameterShortName: '-r',
            description: 'Imagery Rule Id',
            required: false,
        });

        this.imageryId = this.defineStringParameter({
            argumentName: 'IMAGERY',
            parameterLongName: '--imagery',
            parameterShortName: '-i',
            description: 'Imagery Id',
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

        this.resizeIn = this.defineStringParameter({
            argumentName: 'RESIZE_IN',
            parameterLongName: '--resize-in',
            description: `When resizing what kernel to use (${ResizeKernels.join(',')}`,
            required: false,
        });

        this.resizeOut = this.defineStringParameter({
            argumentName: 'RESIZE_OUT',
            parameterLongName: '--resize-out',
            description: `When resizing what kernel to use (${ResizeKernels.join(',')}`,
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

        this.commit = this.defineFlagParameter(TagActions.Commit);
        this.tileSet = this.defineStringParameter(TagActions.TileSet);
        this.projection = this.defineIntegerParameter(TagActions.Projection);
    }
    protected async onExecute(): Promise<void> {
        const name = this.tileSet.value!;
        const projection = Epsg.get(this.projection.value!);
        const imgId = TileMetadataTable.prefix(RecordPrefix.Imagery, this.imageryId.value ?? '');
        const ruleId = TileMetadataTable.prefix(RecordPrefix.ImageryRule, this.ruleId.value ?? '');

        const tsData = await Aws.tileMetadata.TileSet.get(name, projection, TileMetadataNamedTag.Head);

        if (tsData == null) {
            LogConfig.get().fatal({ tileSet: name, projection }, 'Failed to find tile set');
            process.exit(1);
        }
        const before = JSON.stringify(tsData);
        await Aws.tileMetadata.Imagery.getAll(tsData);
        if (imgId !== '') await Aws.tileMetadata.Imagery.get(imgId);

        if (imgId) {
            await this.updatePriority(tsData, ruleId, imgId);
            await this.updateZoom(tsData, ruleId);
            await this.replaceUpdate(tsData, ruleId, imgId);
        }

        this.updateTile(tsData);
        await this.updateDescription(tsData);
        this.updateBackground(tsData);
        this.updateResize(tsData);
        const after = JSON.stringify(tsData);

        await printTileSet(tsData);

        if (before !== after) {
            if (this.commit.value) {
                await Aws.tileMetadata.TileSet.create(tsData);
                await invalidateXYZCache(name, projection, TileMetadataNamedTag.Head, this.commit.value);
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

    async updateDescription(tsData: TileMetadataSetRecord): Promise<boolean> {
        const existing = tsData.description;
        const descriptionPath = this.description.value;
        if (descriptionPath == null) return false;
        const description = (await fs.readFile(descriptionPath)).toString().trim();
        if (description == null || description === existing) return false;
        tsData.description = description;
        return true;
    }

    updateResize(tsData: TileMetadataSetRecord): boolean {
        const existing = tsData.resizeKernel;
        const resizeIn = this.resizeIn.value;
        const resizeOut = this.resizeOut.value;
        if (resizeIn == null && resizeOut == null) return false;
        if (resizeIn == null || resizeOut == null) {
            LogConfig.get().warn({ resizeIn, resizeOut }, 'Both --resize-in and --resize-out need to be defined');
            return false;
        }
        if (!ResizeKernels.includes(resizeIn) || !ResizeKernels.includes(resizeOut)) {
            LogConfig.get().warn({ resizeIn, resizeOut }, 'Invalid --resize-in/-resize-out value');
            return false;
        }
        if (existing != null && existing.in === resizeIn && existing.out === resizeOut) return false;
        tsData.resizeKernel = { in: resizeIn as TileResizeKernel, out: resizeOut as TileResizeKernel };
        return true;
    }

    updateBackground(tsData: TileMetadataSetRecord): boolean {
        const existing = tsData.background;
        const background = this.background.value;
        if (background == null) return false;
        const rgba = parseRgba(background);
        if (
            rgba.r !== existing?.r ||
            rgba.g !== existing?.g ||
            rgba.b !== existing?.b ||
            rgba.alpha !== existing?.alpha
        ) {
            tsData.background = rgba;
            return true;
        }

        return false;
    }

    async replaceUpdate(tsData: TileMetadataSetRecord, ruleId: string, imgId: string): Promise<boolean> {
        const existingIndex = tsData.rules.findIndex((rule) => rule.ruleId === ruleId);
        if (existingIndex == null) return false;
        const existing = tsData.rules[existingIndex];

        const img = await Aws.tileMetadata.Imagery.get(imgId);
        LogConfig.get().info({ ruleId, imgId, imagery: img?.name }, 'Replace');
        tsData.rules[existingIndex] = { ...existing, imgId };
        Aws.tileMetadata.TileSet.sortRenderRules(tsData, Aws.tileMetadata.Imagery.imagery);
        return true;
    }

    async updateZoom(tsData: TileMetadataSetRecord, ruleId: string): Promise<boolean> {
        const existing = tsData.rules.find((rule) => rule.ruleId === ruleId);
        if (existing == null) return false;

        const minZoom = this.minZoom.value;
        const maxZoom = this.maxZoom.value;
        if (minZoom == null || maxZoom == null) return false;
        if (existing.maxZoom === maxZoom && existing.minZoom === minZoom) {
            return false;
        }
        const logger = LogConfig.get();

        const img = await Aws.tileMetadata.Imagery.get(existing.imgId);

        logger.info(
            {
                ruleId,
                imgId: existing.imgId,
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

    async updatePriority(tsData: TileMetadataSetRecord, ruleId?: string, imgId?: string): Promise<boolean> {
        const logger = LogConfig.get();

        const priority = this.priority.value!;
        if (priority == null) return false;

        // Add new imagery
        if (ruleId == null && imgId != null) {
            logger.info({ imgId, priority }, 'Add imagery');
            const img = await Aws.tileMetadata.Imagery.get(imgId);
            logger.info({ imgId, imagery: img.name, priority }, 'Adding');
            tsData.rules.push({
                ruleId: TileMetadataTable.prefix(RecordPrefix.ImageryRule, ulid()),
                imgId,
                minZoom: this.minZoom.value ?? 0,
                maxZoom: this.maxZoom.value ?? 32,
                priority,
            });
            Aws.tileMetadata.TileSet.sortRenderRules(tsData, Aws.tileMetadata.Imagery.imagery);
            return true;
        }

        if (ruleId == null) throw new Error('Cannot update imagery priority without --rule');
        const existing = tsData.rules.find((rule) => rule.ruleId === ruleId);
        if (existing == null) throw new Error('Unable to find imagery rule ' + ruleId);

        if (priority === -1) {
            const existingIndex = tsData.rules.findIndex((rule) => rule.ruleId === ruleId);
            tsData.rules.splice(existingIndex, 1);
            const img = await Aws.tileMetadata.Imagery.get(existing.imgId);

            logger.info({ ruleId, imagery: img?.name, priority: existing.priority }, 'Removing ImageryRule');
            return true;
        }

        if (existing.priority !== priority) {
            // Update
            const img = await Aws.tileMetadata.Imagery.get(existing.imgId);
            logger.info(
                { imgId, imagery: img?.name, oldPriority: existing.priority, newPriority: priority },
                'Update Priority',
            );
            existing.priority = priority;
            Aws.tileMetadata.TileSet.sortRenderRules(tsData, Aws.tileMetadata.Imagery.imagery);
            return true;
        }

        return false;
    }
}

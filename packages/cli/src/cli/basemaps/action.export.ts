import { Epsg } from '@basemaps/geo';
import {
    Aws,
    DefaultBackground,
    LogConfig,
    parseMetadataTag,
    RecordPrefix,
    TileMetadataTable,
    TileMetadataTag,
} from '@basemaps/shared';
import { CommandLineStringParameter } from '@rushstack/ts-command-line';
import { promises as fs } from 'fs';
import { TileSetBaseAction } from './tileset.action';
import {
    compareNamePriority,
    FullImageryConfig,
    ImageryDefaultConfig,
    ProjectionConfig,
    removeRuleDefaults,
} from './tileset.config';
import { defineTagParameter, primeImageryCache, rgbaToHex } from './tileset.util';

/**
 * Convert all the tilesets in the TileMetadataTable to a TileSetConfig. The Head and Production
 * rules tags are converted to one record. If a production rule differs from the head then the rule
 * is marked as non-production.

 * @param table
 */
async function tilesetToConfig(
    name: string,
    projection: Epsg,
    tag: TileMetadataTag,
    defaults: ImageryDefaultConfig[] = [],
): Promise<ProjectionConfig> {
    const item = await Aws.tileMetadata.TileSet.get(name, projection, tag);

    const imageryMap = await primeImageryCache(new Set(item.rules.map((r) => r.imgId)));

    const imagery = item.rules
        .map(
            (rule): FullImageryConfig => {
                const image = imageryMap.get(rule.imgId);
                if (image == null) {
                    throw new Error(`Can't find imagery record "${rule.imgId}" for Tileset "${item.id}"`);
                }
                return {
                    id: TileMetadataTable.unprefix(RecordPrefix.Imagery, rule.imgId),
                    name: image.name,
                    priority: rule.priority,
                    minZoom: rule.minZoom,
                    maxZoom: rule.maxZoom,
                };
            },
        )
        .sort(compareNamePriority)
        .map((r) => removeRuleDefaults(defaults, r));

    return {
        name,
        projection: projection.code,
        title: item.title,
        description: item.description,
        background: rgbaToHex(item.background ?? DefaultBackground),
        resizeKernel: item.resizeKernel,
        defaults,
        imagery,
    };
}

export class ExportAction extends TileSetBaseAction {
    private output: CommandLineStringParameter;
    private defaults: CommandLineStringParameter;
    private tag: CommandLineStringParameter;

    public constructor() {
        super({
            actionName: 'export',
            summary: 'Export imagery and tileset rules',
            documentation: '',
        });
    }

    protected onDefineParameters(): void {
        super.onDefineParameters();
        this.output = this.defineStringParameter({
            argumentName: 'JSON_FILE',
            parameterLongName: '--output',
            parameterShortName: '-o',
            description: 'File to output to',
            required: true,
        });
        this.defaults = this.defineStringParameter({
            argumentName: 'JSON_FILE',
            parameterLongName: '--defaults',
            description:
                'Config File containing rule defaults. This is added to the output and used to minimize the rule fields.',
            required: false,
        });
        defineTagParameter(this);
    }

    protected async onExecute(): Promise<void> {
        const outFile = this.output.value!;

        const tileSet = this.tileSet.value!;
        const projection = Epsg.get(this.projection.value!);
        const tagInput = this.tag.value!;

        const tag = parseMetadataTag(tagInput);
        if (tag == null) {
            LogConfig.get().fatal({ tag }, 'Invalid tag name');
            console.log(this.renderHelpText());
            return;
        }

        const defaults = this.defaults.value
            ? JSON.parse((await fs.readFile(this.defaults.value)).toString())
            : undefined;

        const output = JSON.stringify(await tilesetToConfig(tileSet, projection, tag, defaults), undefined, 2);

        await fs.writeFile(outFile, output, { flag: 'wx' });
    }
}

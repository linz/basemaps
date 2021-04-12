import { ConfigTag, TileSetNameParser } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';
import { Config, LogConfig } from '@basemaps/shared';
import { CommandLineIntegerParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { promises as fs } from 'fs';
import { TagActions } from '../tag.action';
import { TileSetBaseAction } from './tileset.action';
import {
    compareNamePriority,
    FullImageryConfig,
    ImageryDefaultConfig,
    ProjectionConfig,
    removeDefaults,
} from './tileset.config';
import { rgbaToHex } from './tileset.util';

/**
 * Convert all the tilesets in the Config to a TileSetConfig. The Head and Production
 * rules tags are converted to one record. If a production rule differs from the head then the rule
 * is marked as non-production.

 * @param table
 */
async function tilesetToConfig(
    name: string,
    projection: Epsg,
    tag: ConfigTag | string,
    defaults: ImageryDefaultConfig[] = [],
): Promise<ProjectionConfig> {
    const tileSetId = Config.TileSet.id({ name, projection }, tag);
    const item = await Config.TileSet.get(tileSetId);
    if (!Config.TileSet.isRaster(item)) throw new Error('Invalid record');
    const imageryMap = await Config.TileSet.getImagery(item);

    const imagery = item.rules
        .map(
            (rule): FullImageryConfig => {
                const image = imageryMap.get(rule.imgId);
                if (image == null) {
                    throw new Error(`Can't find imagery record "${rule.imgId}" for Tileset "${item.id}"`);
                }
                return {
                    id: Config.unprefix(Config.Prefix.Imagery, rule.imgId),
                    name: image.name,
                    priority: rule.priority,
                    minZoom: rule.minZoom,
                    maxZoom: rule.maxZoom,
                };
            },
        )
        .sort(compareNamePriority)
        .map((r) => removeDefaults(defaults, r));

    return {
        name,
        projection: projection.code,
        background: rgbaToHex(item.background ?? { r: 0, g: 0, b: 0, alpha: 0 }),
        defaults,
        imagery,
    };
}

export class ExportAction extends TileSetBaseAction {
    private output: CommandLineStringParameter;
    private defaults: CommandLineStringParameter;
    private tileSet: CommandLineStringParameter;
    private projection: CommandLineIntegerParameter;
    private tag: CommandLineStringParameter;

    public constructor() {
        super({
            actionName: 'export',
            summary: 'Export imagery and tileset rules',
            documentation: '',
        });
    }

    protected onDefineParameters(): void {
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

        this.tileSet = this.defineStringParameter(TagActions.TileSet);
        this.projection = this.defineIntegerParameter(TagActions.Projection);
        this.tag = this.defineStringParameter(TagActions.Tag);
    }

    protected async onExecute(): Promise<void> {
        const outFile = this.output.value!;

        const tileSet = this.tileSet.value!;
        const projection = Epsg.get(this.projection.value!);
        const tagInput = this.tag.value!;

        const tag = TileSetNameParser.parseTag(tagInput);
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

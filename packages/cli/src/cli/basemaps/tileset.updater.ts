import { ConfigTag, ConfigTileSet, ConfigTileSetRaster, ConfigTileSetVector, TileSetType } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';
import { Config } from '@basemaps/shared';
import * as z from 'zod';
import { parseRgba } from './tileset.util';

export const ImageryConfigDefaults = {
    minZoom: 0,
    maxZoom: 32,
};

const zZoom = z.number().refine((val) => val >= ImageryConfigDefaults.minZoom && val <= ImageryConfigDefaults.maxZoom, {
    message: `must be between ${ImageryConfigDefaults.minZoom} and ${ImageryConfigDefaults.maxZoom}`,
});

const zImageryRule = z
    .object({
        minZoom: zZoom.optional(),
        maxZoom: zZoom.optional(),
    })
    .refine(
        ({ minZoom, maxZoom }) =>
            (minZoom ?? ImageryConfigDefaults.minZoom) <= (maxZoom ?? ImageryConfigDefaults.maxZoom),
        {
            message: 'minZoom may no be greater than maxZoom',
            path: ['minZoom'],
        },
    );

export type ImageryRule = z.infer<typeof zImageryRule>;

const zImageryConfig = zImageryRule.extend({
    2193: z.string().optional(),
    3857: z.string().optional(),
    name: z.string(),
});

const validateColor = (val: string): boolean => {
    try {
        parseRgba(val);
        return true;
    } catch (err) {
        return false;
    }
};

const zBackground = z.string().refine(validateColor, { message: 'Invalid hex color' });

const zTileSetConfig = z.object({
    type: z.string(),
    name: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    background: zBackground,
    layers: z.array(zImageryConfig),
});

/**
 * The Configuration of one Imagery set
 */
export type ImageryConfig = z.infer<typeof zImageryConfig>;

/**
 *  The Configuration for all the imagery in a TileSet
 */
export type TileSetConfig = z.infer<typeof zTileSetConfig>;

export function assertTileSetConfig(json: unknown): asserts json is TileSetConfig {
    zImageryConfig.parse(json);
}
export interface FullImageryConfig {
    2193?: string;
    3857?: string;
    name: string;
    minZoom: number;
    maxZoom: number;
}

export class TileSetUpdater {
    config: TileSetConfig;
    tag: ConfigTag;
    configTileSet: ConfigTileSet;

    /**
     * Class to apply an TileSetConfig source to the tile metadata db

     * @param config a string or TileSetConfig to use
     */
    constructor(config: unknown, tag: ConfigTag) {
        if (typeof config === 'string') config = JSON.parse(config);
        assertTileSetConfig(config);
        this.config = config;
        this.tag = tag;
        this.addDefaults(this.config.layers);
    }

    private async parseConfig(tag: ConfigTag): Promise<ConfigTileSet> {
        if (this.config.type === 'vector') {
            const head = this.loadTileSet(tag);
            const tileSet: ConfigTileSetVector = {
                id: Config.TileSet.id(config.name, tag),
                v: 2,
                type: TileSetType.Vector,
                name: config.name,
                layers: config.layers.map((l) => {
                    return l[3857]!;
                }),
                version: -1,
            };
            return tileSet;
        }
    }

    private async loadTileSet(tag: ConfigTag): Promise<ConfigTileSet | null> {
        const { config } = this;
        const tileSetId = Config.TileSet.id(config.name, tag);
        const tsData = await Config.TileSet.get(tileSetId);

        if (tsData != null) {
            if (Config.TileSet.isRaster(tsData)) {
                const tileSet: ConfigTileSetRaster = {
                    ...Config.record(),
                    v: 2,
                    type: TileSetType.Raster,
                    name: config.name,
                    rules: [],
                    title: config.title,
                    description: config.description,
                    version: -1,
                };
                tileSet.id = Config.TileSet.id(tileSet.name, tag);
                return tileSet;
            }
            if (Config.TileSet.isVector(tsData)) {
                const tileSet: ConfigTileSetVector = {
                    ...Config.record(),
                    v: 2,
                    type: TileSetType.Vector,
                    name: config.name,
                    layers: [],
                    version: -1,
                };
                tileSet.id = Config.TileSet.id(tileSet.name, tag);
                return tileSet;
            }
        }

        return tsData;
    }

    /**
    * Use defaults to ensure all attributes are present for an imagery config rule.

    * @param defaults an array of defaults to apply if the default `nameContains` matches the rule or
    * no `nameContains` field is present. Applied in array order.
    */
    private addDefaults(layers: ImageryConfig[]): void {
        for (const layer of layers) {
            layer.minZoom ??= ImageryConfigDefaults.minZoom;
            layer.maxZoom ??= ImageryConfigDefaults.maxZoom;
            zImageryConfig.parse(layer);
        }
    }
}

import { EpsgCode } from '@basemaps/geo';
import * as z from 'zod';
import { parseRgba } from './tileset.util';

export const ImageryConfigDefaults = {
    priority: 1000,
    minZoom: 0,
    maxZoom: 32,
};

const zZoom = z.number().refine((val) => val >= ImageryConfigDefaults.minZoom && val <= ImageryConfigDefaults.maxZoom, {
    message: `must be between ${ImageryConfigDefaults.minZoom} and ${ImageryConfigDefaults.maxZoom}`,
});

const zImageryRule = z
    .object({
        priority: z
            .number()
            .refine((val) => val >= -1 && val <= 10000, { message: 'must be between -1 and 10000' })
            .optional(),
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
    id: z.string(),
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

const zImageryDefaultConfig = zImageryRule.extend({
    nameContains: z.string().optional(),
});

const zProjectionConfig = z.object({
    name: z.string(),
    projection: z.nativeEnum(EpsgCode),
    title: z.string().optional(),
    description: z.string().optional(),
    background: zBackground,
    defaults: z.array(zImageryDefaultConfig).optional(),
    imagery: z.array(zImageryConfig),
});

/**
 * The Configuration of one Imagery set
 */
export type ImageryConfig = z.infer<typeof zImageryConfig>;

/**
 *  The Configuration for all the imagery in a TileSet
 */
export type ProjectionConfig = z.infer<typeof zProjectionConfig>;

export function assertTileSetConfig(json: unknown): asserts json is ProjectionConfig {
    zProjectionConfig.parse(json);
}

export interface FullImageryConfig {
    id: string;
    name: string;
    priority: number;
    minZoom: number;
    maxZoom: number;
}

export type ImageryDefaultConfig = z.infer<typeof zImageryDefaultConfig>;

const defaultFields: Array<keyof ImageryRule> = ['priority', 'minZoom', 'maxZoom'];

/**
 * Use defaults to ensure all attributes are present for an imagery config rule.

 * @param defaults an array of defaults to apply if the default `nameContains` matches the rule or
 * no `nameContains` field is present. Applied in array order.

 * @param rule the rule which may have missing fields
 */
export function addDefaults(defaults: ImageryDefaultConfig[], rule: ImageryConfig): FullImageryConfig {
    const ans = { ...rule } as FullImageryConfig;

    for (const def of defaults) {
        if (def.nameContains != null) {
            if (rule.name.indexOf(def.nameContains) === -1) continue;
        }
        for (const field of defaultFields) {
            const value = def[field];
            if (value != null) {
                ans[field] ??= value;
            }
        }
    }

    ans.priority ??= ImageryConfigDefaults.priority;
    ans.minZoom ??= ImageryConfigDefaults.minZoom;
    ans.maxZoom ??= ImageryConfigDefaults.maxZoom;

    zImageryConfig.parse(ans);
    return ans as FullImageryConfig;
}

/**
 * Use defaults to remove any derivable attributes in the rule. (see `addDefaults`)

 * @param defaults
 * @param rule
 */
export function removeDefaults(defaults: ImageryDefaultConfig[], rule: FullImageryConfig): ImageryConfig {
    const removeFields = new Map<string, boolean>();
    for (const def of defaults) {
        if (def.nameContains != null && rule.name.indexOf(def.nameContains) === -1) continue;

        for (const field of defaultFields) {
            if (field in def) {
                if (removeFields.has(field)) continue;

                removeFields.set(field, def[field] === rule[field]);
            }
        }
    }
    const config: ImageryConfig = { id: rule.id, name: rule.name };

    for (const field of defaultFields) {
        if (!removeFields.get(field)) {
            config[field] = rule[field];
        }
    }
    return config;
}

export function compareNamePriority(a: FullImageryConfig, b: FullImageryConfig): number {
    if (a.name === b.name) return b.priority - a.priority;
    return a.name.localeCompare(b.name);
}

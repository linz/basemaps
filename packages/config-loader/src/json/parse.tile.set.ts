import { ConfigTileSetOutputParser, parseRgba, TileSetType } from '@basemaps/config';
import { z } from 'zod';

export function validateColor(str: string): boolean {
  try {
    parseRgba(str);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * parse a RGB alpha color object
 *
 * TODO: Current {@link parseRgba} defaults all values to 0 if they do not exist, this expects all values to exist
 */
const rgbaObject = z.object({
  r: z.number(),
  g: z.number(),
  b: z.number(),
  alpha: z.number(),
});

const hexColorString = z
  .string()
  .refine(validateColor, { message: 'Invalid hex color' })
  .transform((f) => parseRgba(f));

const zBackground = z.union([hexColorString, rgbaObject]);

export const ImageryConfigDefaults = {
  minZoom: 0,
  maxZoom: 32,
};

const zZoom = z.number().refine((val) => val >= ImageryConfigDefaults.minZoom && val <= ImageryConfigDefaults.maxZoom, {
  message: `must be between ${ImageryConfigDefaults.minZoom} and ${ImageryConfigDefaults.maxZoom}`,
});

const zLayerConfig = z
  .object({
    name: z.string(),
    title: z.string(),
    category: z.string().optional(),
    2193: z.string().optional(),
    3857: z.string().optional(),
    minZoom: zZoom.optional(),
    maxZoom: zZoom.optional(),
  })
  .refine(
    ({ minZoom, maxZoom }) =>
      (minZoom ? minZoom : ImageryConfigDefaults.minZoom) <= (maxZoom ? maxZoom : ImageryConfigDefaults.maxZoom),
    {
      message: 'minZoom may no be greater than maxZoom',
      path: ['minZoom'],
    },
  );

const zTileSetOutputsParser = z
  .array(ConfigTileSetOutputParser)
  .optional()
  .superRefine((items, ctx) => {
    if (items == null) return;

    const names = new Set<string>();
    const defaults: number[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (names.has(item.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate output name "${item.name}"`,
          path: [i, 'name'],
        });
      }
      names.add(item.name);
      if (item.default) defaults.push(i);
    }

    for (const index of defaults.slice(1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate default outputs "${items[index].name}"`,
        path: [index, 'default'],
      });
    }
  });

export const zTileSetConfig = z.object({
  type: z.nativeEnum(TileSetType),
  id: z.string(),
  title: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
  background: zBackground.optional(),
  layers: z.array(zLayerConfig),
  minZoom: zZoom.optional(),
  maxZoom: zZoom.optional(),
  format: z.string().optional(),
  outputs: zTileSetOutputsParser,
  aliases: z.array(z.string()).optional(),
});

export type TileSetConfigSchemaLayer = z.infer<typeof zLayerConfig>;
/**
 *  The Configuration for all the imagery in a TileSet
 */
export type TileSetConfigSchema = z.infer<typeof zTileSetConfig>;

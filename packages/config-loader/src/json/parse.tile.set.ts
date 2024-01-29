import { parseRgba, TileSetType } from '@basemaps/config';
import { z } from 'zod';

export function validateColor(str: string): boolean {
  try {
    parseRgba(str);
    return true;
  } catch (err) {
    return false;
  }
}

const zBackground = z.string().refine(validateColor, { message: 'Invalid hex color' });

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
});

export type TileSetConfigSchemaLayer = z.infer<typeof zLayerConfig>;
/**
 *  The Configuration for all the imagery in a TileSet
 */
export type TileSetConfigSchema = z.infer<typeof zTileSetConfig>;

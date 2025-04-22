import { z } from 'zod';

export const zStyling = z.object({
  minZoom: z.number(),
  maxZoom: z.number(),
  detail: z.number().optional(),
});

export const zTag = z.record(z.string().or(z.boolean()));

export const zAttributes = z.record(z.string());

export const zSpecialTag = z.object({
  condition: z.string(),
  tags: zTag,
});

export const zSimplify = z.object({
  style: zStyling,
  tolerance: z.number().optional(),
});

export const zLayer = z.object({
  id: z.string(),
  name: z.string(),
  source: z.string(),
  tags: zTag,
  attributes: zAttributes.optional(),
  style: zStyling,
  simplify: z.array(zSimplify).optional(),
  tippecanoe: z.array(z.string()).optional(),
});

export const zSchema = z.object({
  name: z.string(),
  metadata: z.object({
    attributes: z.array(z.string()),
  }),
  simplify: z.array(zSimplify).optional(),
  layers: z.array(zLayer),
});

export type zTypeLayer = z.infer<typeof zLayer>;
export type zTypeSchema = z.infer<typeof zSchema>;

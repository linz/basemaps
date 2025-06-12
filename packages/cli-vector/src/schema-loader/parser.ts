import { z } from 'zod';

import { Attributes, Layer, Schema, Simplify, SpecialTag, Styling, Tags } from './schema.js';

export const zStyling = z.object({
  minZoom: z.number(),
  maxZoom: z.number(),
  detail: z.number().optional(),
}) satisfies z.ZodType<Styling>;

export const zTags = z.record(z.string().or(z.boolean())) satisfies z.ZodType<Tags>;

export const zAttributes = z.record(z.string()) satisfies z.ZodType<Attributes>;

export const zSpecialTag = z.object({
  condition: z.string(),
  tags: zTags,
}) satisfies z.ZodType<SpecialTag>;

export const zSimplify = z.object({
  style: zStyling,
  tolerance: z.number().optional(),
}) satisfies z.ZodType<Simplify>;

export const zLayer = z.object({
  id: z.string(),
  name: z.string(),
  version: z.number().optional(),
  source: z.string(),
  tags: zTags,
  attributes: zAttributes.optional(),
  style: zStyling,
  simplify: z.array(zSimplify).optional(),
  tippecanoe: z.array(z.string()).optional(),
}) satisfies z.ZodType<Layer>;

export const zSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  custom: z.boolean().optional(),
  metadata: z.object({
    attributes: z.array(z.string()),
  }),
  simplify: z.array(zSimplify).optional(),
  layers: z.array(zLayer),
}) satisfies z.ZodType<Schema>;

export type zTypeLayer = z.infer<typeof zLayer>;
export type zTypeSchema = z.infer<typeof zSchema>;

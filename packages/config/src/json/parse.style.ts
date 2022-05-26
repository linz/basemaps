import { z } from 'zod';

export const zStyleJson = z.object({
  id: z.string(),
  version: z.number(),
  name: z.string(),
  metadata: z.unknown().optional(),
  sprite: z.string().optional(),
  glyphs: z.string().optional(),
  sources: z.unknown(),

  // TODO it would be good to actually validate all the styles
  layers: z.array(z.unknown()),
});

export type StyleJsonConfigSchema = z.infer<typeof zStyleJson>;

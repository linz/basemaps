import { z } from 'zod';

export const ConfigImageFormatParser = z.union([
  z.literal('webp'),
  z.literal('png'),
  z.literal('jpeg'),
  z.literal('avif'),
]);
export const ConfigResizeKernelParser = z.union([z.literal('nearest'), z.literal('lanczos3'), z.literal('lanczos2')]);

export const ConfigTileSetPipelineParser = z.object({
  /**
   * type of pipeline function
   *
   * @example "terrain-rgb"
   */
  type: z.string(),
  // TODO allow custom arguments
});

export const ConfigRgbaParser = z.object({ r: z.number(), g: z.number(), b: z.number(), alpha: z.number() });

export const ConfigTileSetOutputParser = z.object({
  /**
   * Human friendly description of the output
   */
  title: z.string(),
  /**
   * Common URL friendly name for the configuration
   *
   * @example "terrain-rgb", "color-ramp"
   */
  name: z.string(),
  /**
   * Processing pipeline, for configuration on how to convert the source into a RGBA output
   */
  pipeline: z.array(ConfigTileSetPipelineParser).optional(),

  /**
   * Allowed output file format to use
   *
   * Will default to all image formats
   * the order is important with the best default format listed first
   *
   * @default ImageFormat[] - All Image formats
   */
  format: z.array(ConfigImageFormatParser).optional(),

  /**
   * Background to render for areas where there is no data, falls back to
   * {@link ConfigTileSetRaster.background} if not defined
   *
   * @default ConfigTileSetRaster.background
   */
  background: ConfigRgbaParser.optional(),

  /**
   * When scaling tiles in the rendering process what kernel to use
   *
   * will fall back to {@link ConfigTileSetRaster.resizeKernel} if not defined
   *
   * @default ConfigTileSetRaster.resizeKernel
   */
  resizeKernel: z
    .object({
      in: ConfigResizeKernelParser,
      out: ConfigResizeKernelParser,
    })
    .optional(),
});

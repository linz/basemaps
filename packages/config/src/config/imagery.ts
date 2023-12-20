import { EpsgCode } from '@basemaps/geo';
import { z } from 'zod';

import { ConfigBase } from './base.js';

export const ConfigImageryOverviewParser = z
  .object({
    /**
     * Path to overview archive
     *
     * This is relative path to the {@link ConfigImagery.uri}
     */
    path: z.string(),

    /**
     * Min zoom for the overview archive,
     *
     * 0 means tiles for z0 exist inside the archive
     *
     * @example 0
     */
    minZoom: z.number().refine((r) => r >= 0 && r <= 32),
    /**
     * Max zoom for the overview archive
     * 15 means tiles for z15 exist in this overview archive
     *
     * @example 15
     */
    maxZoom: z.number().refine((r) => r >= 0 && r <= 32),
  })
  .refine((obj) => obj.minZoom < obj.maxZoom);

export const BoundingBoxParser = z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() });
export const NamedBoundsParser = z.object({
  /**
   *  Name of the file relative to the {@link ConfigImagery.uri}
   * @example
   * - "2-3-2.tiff"
   */
  name: z.string(),
  /**
   * Origin X in meters
   */
  x: z.number(),
  /**
   * Origin Y in meters
   */
  y: z.number(),
  /**
   * width of the imagery in meters
   */
  width: z.number(),
  /**
   * Height of the imagery in meters
   */
  height: z.number(),
});

export type ConfigImageryOverview = z.infer<typeof ConfigImageryOverviewParser>;

export const ConfigImageryParser = ConfigBase.extend({
  /**
   * Projection for the imagery
   */
  projection: z.nativeEnum(EpsgCode),

  /**
   * tileMatrix identifier
   *
   * @example
   * - "WebMercatorQuad"
   * - "NZTM2000Quad"
   */
  tileMatrix: z.string(),

  /**
   * Human friendly title for the imagery
   *
   */
  title: z.string(),

  /**
   * Categorize imagery into a group, eg Rural vs Urban vs Satellite vs DEM
   *
   * @example
   * - "Event"
   * - "Rural Aerial Photos"
   */
  category: z.string().optional(),

  /**
   * The location of the COGs like
   *
   * This should be a URL with a trailing slash
   *
   * @example
   * - s3://linz-basemaps/3857/aerial/jobId123/
   */
  uri: z.string(),

  /**
   * the bounding box of all the COGs
   */
  bounds: BoundingBoxParser,

  /**
   * list of files and their bounding box
   */
  files: z.array(NamedBoundsParser),

  /**
   * Separate overview cache
   */
  overviews: ConfigImageryOverviewParser.optional(),
});

export type ConfigImagery = z.infer<typeof ConfigImageryParser>;

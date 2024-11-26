import { EpsgCode } from '@basemaps/geo';
import { z } from 'zod';

import { ConfigBase } from './base.js';

/**
 * Taken from tiff's SampleFormat
 *
 * @link https://www.awaresystems.be/imaging/tiff/tifftags/sampleformat.html
 */
export type ImageryDataType = 'uint' | 'int' | 'float' | 'void' | 'unknown' | 'cint' | 'cfloat';

// TODO add more band types
export const ImageryBandParser = z.union([
  z.literal('float16'),
  z.literal('float32'),
  z.literal('uint8'),
  z.literal('uint16'),
]);
export type ImageryBandType = z.infer<typeof ImageryBandParser>;

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

/**
 * Provides information about a provider.
 *
 * @link https://github.com/radiantearth/stac-spec/blob/master/commons/common-metadata.md#provider
 */
export const ProvidersParser = z.object({
  /**
   * The name of the organization or the individual.
   */
  name: z.string(),

  /**
   * Multi-line description to add further provider information such as processing details
   * for processors and producers, hosting details for hosts or basic contact information.
   */
  description: z.string().optional(),

  /**
   * Roles of the provider. Any of `licensor`, `producer`, `processor` or `host`.
   */
  roles: z.array(z.string()).optional(),

  /**
   * Homepage on which the provider describes the dataset and publishes contact information.
   */
  url: z.string().optional(),
});

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
   * Information about the common bands for the datasets
   */
  bands: z.array(ImageryBandParser).optional(),

  /**
   * Optional noData value for the source
   *
   * @example -9999
   */
  noData: z.number().optional(),

  /**
   * list of files and their bounding box
   */
  files: z.array(NamedBoundsParser),

  /**
   * Separate overview cache
   */
  overviews: ConfigImageryOverviewParser.optional(),

  /**
   * list of providers and their metadata
   */
  providers: z.array(ProvidersParser).optional(),
});

export type ConfigImagery = z.infer<typeof ConfigImageryParser>;

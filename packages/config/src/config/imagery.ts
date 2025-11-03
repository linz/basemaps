import { EpsgCode } from '@basemaps/geo';
import { z } from 'zod';

import { ConfigBase } from './base.js';

export const ConfigImageryVersion = 2;

/**
 * Taken from tiff's SampleFormat
 *
 * @link https://www.awaresystems.be/imaging/tiff/tifftags/sampleformat.html
 */
export type ImageryDataType = 'uint' | 'int' | 'float' | 'void' | 'unknown' | 'cint' | 'cfloat';

// TODO add more band types
export const ImageryBandDataTypeParser = z.union([
  z.literal('float16'),
  z.literal('float32'),
  z.literal('uint8'),
  z.literal('uint16'),
]);
export type ImageryBandDataType = z.infer<typeof ImageryBandDataTypeParser>;
export type ImageryBandType = z.infer<typeof ConfigImageryBandParser>;

export const ConfigImageryBandParser = z.object({
  /** Band data type  */
  type: ImageryBandDataTypeParser,
  /**
   * GDAL color interpretation for the band
   *
   * eg: red|green|blue|alpha|gray|undefined|pan|coastal|rededge|nir|swir|mwir|lwir|...
   *
   * @link https://gdal.org/en/stable/programs/gdal_translate.html#cmdoption-gdal_translate-colorinterp
   */
  color: z.string().optional(),
  /** Optional GDAL stats about the imagery if the tiff was made with `-stats` */
  stats: z
    .object({
      min: z.number(),
      max: z.number(),
      mean: z.number(),
      stddev: z.number(),
    })
    .optional(),
});

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

export const ConfigImageryBase = ConfigBase.extend({
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

export type ConfigImagery = z.infer<typeof ConfigImageryV2Parser>;

export type ConfigImageryV1 = z.infer<typeof ConfigImageryV1Parser>;

export type ConfigImageryAll = ConfigImagery | ConfigImageryV1;

export const ConfigImageryV1Parser = ConfigImageryBase.extend({
  v: z.undefined(),
  /** Optional basic band data type information */
  bands: z.array(ImageryBandDataTypeParser).optional(),
  /**
   * Optional Human friendly title for the imagery
   */
  title: z.string().optional(),
});

/**
 * Version two of imagery configuration adds more information about the bands found inside the imagery
 */
export const ConfigImageryV2Parser = ConfigImageryBase.extend({
  v: z.literal(ConfigImageryVersion),

  /** Human friendly title for the imagery */
  title: z.string(),

  /** Band information  */
  bands: z.array(ConfigImageryBandParser),
});

export const ConfigImageryParser = z.discriminatedUnion('v', [ConfigImageryV1Parser, ConfigImageryV2Parser]);

import { createHash } from 'node:crypto';

import { ImageryBandType, Rgba } from '@basemaps/config';
import { EpsgCode, Tile } from '@basemaps/geo';
import { StacCollection, StacItem, StacLink } from 'stac-ts';

export interface CogifyCreationOptions {
  /** Preset GDAL config to use */
  preset: string;

  /** Tile to be created */
  tile: Tile;

  /** Tile matrix to create the tiles against */
  tileMatrix: string;

  /** Projection of source imagery */
  sourceEpsg: number;

  /** Band information of the source imagery
   *
   * @example
   * ```
   * ["uint8"] // one band uint8 eg grey scale
   * ["float32"] // one band float32 eg elevation data
   * ["uint8","uint8","uint8"] // three band uint8 eg RGB
   * ```
   */
  sourceBands?: ImageryBandType[];

  /**
   * Compression to use for the cog
   *
   * @default 'webp'
   */
  compression?: 'webp' | 'jpeg' | 'lerc' | 'zstd' | 'lzw';

  /**
   * Output tile size
   *
   * @default 512
   */
  blockSize?: number;

  /** Target base zoom level */
  zoomLevel: number;

  /**
   * Compression quality
   *
   * @default 90
   */
  quality?: number;

  /** Max Z Error only used when compression is `lerc` */
  maxZError?: number;

  /** Max Z Error only used when compression is `lerc` defaults to {maxZError} */
  maxZErrorOverview?: number;

  /**
   * Resampling for warping
   * @default 'bilinear'
   */
  warpResampling?: GdalResampling;

  /**
   * Resampling for overview
   * @default 'lanczos'
   */
  overviewResampling?: GdalResampling;

  /** Color with which to replace all transparent COG pixels */
  background?: Rgba;
}

export interface GeneratedProperties {
  /** Package name that generated the file */
  package: string;

  /** Version number that generated the file */
  version: string;

  /** Git commit hash that the file was generated with */
  hash: string;

  /** ISO date of the time this file was generated */
  datetime: string;

  /** version of GDAL used to create the COG */
  gdal?: string;

  /**
   * is the tiff invalid
   *
   * If the tiff was generated but then determined to be invalid this property explains why the tiff was rejected.
   *
   * Reasons:
   * - "empty" - No data was produced by GDAL when creating the tiff
   */
  invalid?: 'empty';
}

export type GdalResampling = 'nearest' | 'bilinear' | 'cubic' | 'cubicspline' | 'lanczos' | 'average' | 'mode';

export type CogifyStacCollection = StacCollection;

/**
 * Is the the provided stac item a topographic map sheet creation request or a generic cog creation request
 * @returns true if a linz:map_sheet is found false otherwise.
 */
export function isTopoStacItem(x: CogifyStacItem | TopoStacItem): x is TopoStacItem {
  return typeof x['properties']['linz:map_sheet'] === 'string';
}
export type CogifyStacItem = StacItem & {
  properties: {
    'linz_basemaps:generated': GeneratedProperties;
    'linz_basemaps:options': CogifyCreationOptions;
  };
};

export type TopoStacItem = StacItem & {
  properties: {
    /**
     * A topo50 or topo250 raster map sheet's code.
     *
     * @example
     * - topo50: "CJ10", "BQ31"
     * - topo250: "00", "03", "05"
     */
    'linz:map_sheet': string;

    /**
     * A map sheet's version.
     *
     * @example "v1.00"
     *
     * @see https://github.com/stac-extensions/version
     */
    version: string;

    /**
     * An EpsgCode Enum representing a map sheet's projection.
     *
     * @example EpsgCode.Nztm2000 = 2193
     *
     * @see https://github.com/stac-extensions/projection
     */
    'proj:epsg': EpsgCode;

    'linz_basemaps:generated': GeneratedProperties;
    'linz_basemaps:options': {
      /** Tile matrix to create the tiles against */
      tileMatrix: string;

      /** Projection of source imagery */
      sourceEpsg: number;
    };
  };
};

/** The cutline that was used on the imagery */
export type CogifyLinkCutline = StacLink & { rel: 'linz_basemaps:cutline'; blend: number };
/** Link back to the source imagery that was used to create the cog */
export type CogifyLinkSource = StacLink & {
  rel: 'linz_basemaps:source';
  'linz_basemaps:source_width': number;
  'linz_basemaps:source_height': number;
};

/** Find all the linz_basemaps:source links */
export function getSources(links: StacLink[]): CogifyLinkSource[] {
  return links.filter((f) => f.rel === 'linz_basemaps:source') as CogifyLinkSource[];
}

/** find the linz_basemaps:cutline link if it exists */
export function getCutline(links: StacLink[]): CogifyLinkCutline | null {
  return links.find((f) => f.rel === 'linz_basemaps:cutline') as CogifyLinkCutline;
}

/** Generate the STAC file:size and file:checksum fields from a buffer */
export function createFileStats(data: string | Buffer): { 'file:size': number; 'file:checksum': string } {
  return {
    'file:size': Buffer.isBuffer(data) ? data.byteLength : data.length,
    // Multihash header for sha256 is 0x12 0x20
    'file:checksum': '1220' + createHash('sha256').update(data).digest('hex'),
  };
}

import { createHash } from 'node:crypto';

import { Rgba } from '@basemaps/config';
import { Tile } from '@basemaps/geo';
import { StacCollection, StacItem, StacLink } from 'stac-ts';

export interface CogifyCreationOptions {
  /** Preset GDAL config to use */
  preset: string;

  /** Tile Id to be created */
  tileId: string;

  /** Tile to be created */
  tile?: Tile;

  /** Tile matrix to create the tiles against */
  tileMatrix: string;

  /** Projection of source imagery */
  sourceEpsg: number;
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

  /**
   * compression method for overview
   */
  overviewCompress?: string;

  /**
   * JPEG/WEBP quality setting for overviews range from 1 to 100
   */
  overviewQuality?: number;

  /** Color with which to replace all transparent COG pixels */
  background?: Rgba;

  /** Adds an alpha mask band to the VRT when the source raster have none. */
  addalpha?: boolean;

  /** Stop to reproject the imagery by gdalwarp*/
  noReprojecting?: boolean;

  /**
   * External overviews can be created in the BigTIFF format
   *
   * @default IF_NEEDED
   */
  bigTIFF?: 'YES' | 'NO' | 'IF_NEEDED' | 'IF_SAFER';

  /**
   * Selects a subwindow from the source image for copying based on pixel/line location.
   */
  srcwin?: number[];
}

export type GdalResampling = 'nearest' | 'bilinear' | 'cubic' | 'cubicspline' | 'lanczos' | 'average' | 'mode';

export type CogifyStacCollection = StacCollection;
export type CogifyStacItem = StacItem & {
  properties: {
    'linz_basemaps:generated': {
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
    };
    'linz_basemaps:options': CogifyCreationOptions;
  };
};

/** The cutline that was used on the imagery */
export type CogifyLinkCutline = StacLink & { rel: 'linz_basemaps:cutline'; blend: number };
/** Link back to the source imagery that was used to create the cog */
export type CogifyLinkSource = StacLink & { rel: 'linz_basemaps:source' };

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

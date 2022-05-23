import { Bounds, Epsg, TileMatrixSet } from '@basemaps/geo';
import { CompositeError, LoggerFatalError, LogType, Projection } from '@basemaps/shared';
import { ChunkSource } from '@chunkd/core';
import { CogTiff, TiffTag, TiffTagGeo } from '@cogeotiff/core';
import pLimit, { LimitFunction } from 'p-limit';
import { basename } from 'path';
import { Cutline } from './cutline.js'; //
import { ProjectionLoader } from './projection.loader.js';
import { CogBuilderMetadata, SourceMetadata } from './types.js';

export const InvalidProjectionCode = 32767;

/**
 * Attempt to guess the projection based off the WKT
 *
 * @example
 *
 * "PCS Name = NZGD_2000_New_Zealand_Transverse_Mercator|GCS Name = GCS_NZGD_2000|Ellipsoid = GRS_1980|Primem = Greenwich||"
 * "NZGD2000_New_Zealand_Transverse_Mercator_2000|GCS Name = GCS_NZGD_2000|Primem = Greenwich||"
 *
 * @param wkt
 */
export function guessProjection(wkt: string | null): Epsg | null {
  if (wkt == null) return null;
  const searchWkt = wkt.replace(/_/g, ' ');
  if (searchWkt.includes('New Zealand Transverse Mercator')) return Epsg.Nztm2000;
  if (searchWkt.includes('Chatham Islands Transverse Mercator 2000')) return Epsg.Citm2000;

  return null;
}

export class CogBuilder {
  q: LimitFunction;
  logger: LogType;
  targetTms: TileMatrixSet;
  srcProj?: Epsg;

  // Prevent guessing spamming the logs
  wktPreviousGuesses = new Set<string>();

  /**
   * @param concurrency number of requests to run at a time
   */
  constructor(targetTms: TileMatrixSet, concurrency: number, logger: LogType, srcProj?: Epsg) {
    this.targetTms = targetTms;
    this.logger = logger;
    this.q = pLimit(concurrency);
    this.srcProj = srcProj;
  }

  /**
   * Get the source bounds a collection of tiffs
   * @param tiffs
   */
  async bounds(sources: ChunkSource[]): Promise<SourceMetadata> {
    let resX = -1;
    let bands = -1;
    let projection = this.srcProj;
    let nodata: number | undefined;
    let count = 0;

    const queue = sources.map((source) => {
      return this.q(async () => {
        count++;
        if (count % 50 === 0) this.logger.info({ count, total: sources.length }, 'BoundsProgress');
        this.logger.trace({ source: source.uri }, 'Tiff:Load');

        const tiff = new CogTiff(source);
        await tiff.init(true);
        const image = tiff.getImage(0);
        if (resX === -1 || image.resolution[0] < resX) resX = image.resolution[0];

        // Check number of bands to determine alpha layer
        const tiffBandCount = image.value(TiffTag.BitsPerSample) as number[] | null;
        if (tiffBandCount != null && tiffBandCount.length > bands) {
          if (bands > -1) {
            this.logger.error(
              {
                firstImage: basename(sources[0].uri),
                bands,
                currentImage: basename(source.uri),
                currentBands: tiffBandCount,
              },
              'Multiple Bands',
            );
          }
          bands = tiffBandCount.length;
        }

        const output = { ...Bounds.fromBbox(image.bbox).toJson(), name: source.uri };

        if (source.close) await source.close();

        const imageProjection = this.findProjection(tiff);
        if (imageProjection != null && projection?.code !== imageProjection.code) {
          if (projection != null) {
            this.logger.error(
              {
                firstImage: basename(sources[0].uri),
                projection,
                currentImage: basename(source.uri),
                currentProjection: imageProjection,
              },
              'Multiple projections',
            );
            throw new Error('Multiple projections');
          }
          projection = imageProjection;
        }

        const tiffNoData = this.findNoData(tiff);
        if (tiffNoData != null && tiffNoData !== nodata) {
          if (nodata != null) throw new Error('Multiple No Data values');
          nodata = tiffNoData;
        }

        return output;
      }).catch((e) => {
        throw new CompositeError('Failed to process image: ' + source.uri, 500, e);
      });
    });

    const bounds = await Promise.all(queue);

    if (projection == null) throw new Error('No projection detected');
    if (resX === -1) throw new Error('No resolution detected');
    if (bands === -1) throw new Error('No image bands detected');

    return {
      projection: projection.code,
      nodata,
      bands,
      bounds,
      pixelScale: resX,
      resZoom: Projection.getTiffResZoom(this.targetTms, resX),
    };
  }

  findProjection(tiff: CogTiff): Epsg {
    const image = tiff.getImage(0);

    const projection = image.valueGeo(TiffTagGeo.ProjectedCSTypeGeoKey) as number;
    if (projection != null && projection !== InvalidProjectionCode) {
      return Epsg.tryGet(projection) ?? new Epsg(projection);
    }

    const imgWkt = image.value<string>(TiffTag.GeoAsciiParams);
    const epsg = guessProjection(imgWkt);
    if (imgWkt != null && epsg != null) {
      if (!this.wktPreviousGuesses.has(imgWkt)) {
        this.logger.trace({ tiff: tiff.source.uri, imgWkt, projection }, 'GuessingProjection from GeoAsciiParams');
      }
      this.wktPreviousGuesses.add(imgWkt);
      return epsg;
    }

    this.logger.error({ tiff: tiff.source.uri, projection, imgWkt }, 'Failed find projection');
    if (this.srcProj != null) return this.srcProj;
    throw new Error('Failed to find projection');
  }

  /**
   * Get the nodata value stored in the source tiff
   * @param tiff
   * @param logger
   */
  findNoData(tiff: CogTiff): number | null {
    const noData = tiff.getImage(0).value<string>(TiffTag.GDAL_NODATA);
    if (noData == null) return null;

    const noDataNum = parseInt(noData);

    if (isNaN(noDataNum) || noDataNum < 0 || noDataNum > 256) {
      throw new LoggerFatalError({ tiff: tiff.source.uri, noData }, 'Failed converting GDAL_NODATA, defaulting to 255');
    }

    return noDataNum;
  }

  /**
   * Generate a list of tiles that need to be generated to cover the source tiffs
   * @param tiffs list of source imagery to be converted
   * @returns List of Tile bounds covering tiffs
   */
  async build(tiffs: ChunkSource[], cutline: Cutline, maxImageSize?: number): Promise<CogBuilderMetadata> {
    const metadata = await this.bounds(tiffs);
    // Ensure that the projection definition is loaded
    await ProjectionLoader.load(metadata.projection);
    const files = cutline.optimizeCovering(metadata, maxImageSize);
    let union: Bounds | null = null;
    for (const bounds of files) {
      if (union == null) union = Bounds.fromJson(bounds);
      else union = Bounds.fromJson(bounds).union(union);
    }
    if (union == null) throw new Error('Bug! union can not be null');
    return { ...metadata, files, targetBounds: union.toJson() };
  }
}

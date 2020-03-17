import { EPSG, GeoJson, Projection } from '@basemaps/geo';
import { LogType } from '@basemaps/lambda-shared';
import { CogSource, CogTiff, TiffTag, TiffTagGeo } from '@cogeotiff/core';
import { CogSourceFile } from '@cogeotiff/source-file';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import pLimit, { Limit } from 'p-limit';
import * as path from 'path';
import { TileCover } from './cover';
import { getProjection, guessProjection } from './proj';

export interface CogBuilderMetadata extends CogBuilderBounds {
    /** Quadkey indexes for the covering tiles */
    covering: string[];
}

export interface CogBuilderBounds {
    /** Number of imagery bands generally RGB (3) or RGBA (4) */
    bands: number;
    /** Bounding box for polygons */
    bounds: GeoJSON.FeatureCollection;
    /** Lowest quality resolution of image */
    resolution: number | -1;

    /** EPSG projection number */
    projection: number;

    /** GDAL_NODATA value */
    nodata: number;
}
export const InvalidProjectionCode = 32767;
export const CacheFolder = './.cache';
export const proj256 = new Projection(256);
export class CogBuilder {
    q: Limit;
    cover: TileCover;
    maxTileCount: number;
    maxTileZoom: number;

    /**
     * @param concurrency number of requests to run at a time
     */
    constructor(concurrency: number, tileCountMax = 25, tileZoomMax = 13) {
        this.q = pLimit(concurrency);
        this.maxTileCount = tileCountMax;
        this.maxTileZoom = tileZoomMax;
    }

    /**
     * Get the source bounds a collection of tiffs
     * @param tiffs
     */
    async bounds(sources: CogSource[], logger: LogType): Promise<CogBuilderBounds> {
        let resolution = -1;
        let bandCount = -1;
        let projection = -1;
        let nodata = -1;
        let count = 0;
        const coordinates = sources.map(source => {
            return this.q(async () => {
                count++;
                if (count % 50 == 0) {
                    logger.info({ count, total: sources.length }, 'BoundsProgress');
                }
                const tiff = new CogTiff(source);
                await tiff.init(true);
                const image = tiff.getImage(0);
                const tiffRes = await this.getTiffResolution(tiff);
                if (tiffRes > resolution) {
                    resolution = tiffRes;
                }
                const tiffBandCount = image.value(TiffTag.BitsPerSample) as number[] | null;
                if (tiffBandCount != null && tiffBandCount.length > bandCount) {
                    bandCount = tiffBandCount.length;
                }

                const output = await this.getTifBounds(tiff, logger);
                if (CogSourceFile.isSource(source)) {
                    await source.close();
                }

                const imageProjection = this.findProjection(tiff, logger);
                if (imageProjection != null && imageProjection != projection) {
                    if (projection != -1) {
                        throw new Error('Multiple projections');
                    }
                    projection = imageProjection;
                }

                const noData = this.findNoData(tiff, logger);
                if (noData != null && noData != nodata) {
                    if (nodata != -1) {
                        throw new Error('Multiple No Data values');
                    }
                    nodata = noData;
                }

                return output;
            });
        });

        const polygons = await Promise.all(coordinates);
        return {
            projection,
            nodata,
            bands: bandCount,
            bounds: GeoJson.toFeatureCollection(polygons),
            resolution,
        };
    }

    /**
     * Find the closest resolution to the tiff image
     * @param tiff
     */
    async getTiffResolution(tiff: CogTiff): Promise<number> {
        const image = tiff.getImage(0);

        // Get best image resolution
        const [resX] = image.resolution;
        let z = 30;
        while (z > 0) {
            const currentZoom = proj256.getResolution(z);
            if (currentZoom >= resX) {
                break;
            }
            z--;
        }
        return z;
    }

    findProjection(tiff: CogTiff, logger: LogType): EPSG {
        const image = tiff.getImage(0);

        let projection = image.valueGeo(TiffTagGeo.ProjectedCSTypeGeoKey) as number;
        if (projection != InvalidProjectionCode) {
            return projection;
        }

        const imgWkt = image.value(TiffTag.GeoAsciiParams);
        projection = guessProjection(imgWkt) as number;
        if (projection) {
            logger.trace({ tiff: tiff.source.name, imgWkt, projection }, 'GuessingProjection from GeoAsciiParams');
            return projection;
        }

        logger.error({ tiff: tiff.source.name }, 'Failed find projection');
        throw new Error('Failed to find projection');
    }

    /**
     * Get the nodata value stored in the source tiff
     * @param tiff
     * @param logger
     */
    findNoData(tiff: CogTiff, logger: LogType): number {
        const gdalNoData: string = tiff.getImage(0).value(TiffTag.GDAL_NODATA);
        /* can't read GDAL_NODATA value*/
        if (gdalNoData) {
            const noDataNum = parseInt(gdalNoData);
            /* can't parse GDAL_NODATA value or its invalid */
            if (noDataNum && -1 < noDataNum && noDataNum < 256) {
                return noDataNum;
            }
            logger.warn({ tiff: tiff.source.name }, 'Failed converting GDAL_NODATA, defaulting to 255');
            return 255;
        }
        logger.warn({ tiff: tiff.source.name }, 'Failed reading GDAL_NODATA, defaulting to 255');
        return 255;
    }

    /**
     * Generate the bounding boxes for a GeoTiff converting to WGS84
     * @param tiff
     */
    async getTifBounds(tiff: CogTiff, logger: LogType): Promise<GeoJSON.Feature> {
        const image = tiff.getImage(0);
        const bbox = image.bbox;
        const topLeft = [bbox[0], bbox[3]];
        const topRight = [bbox[2], bbox[3]];
        const bottomRight = [bbox[2], bbox[1]];
        const bottomLeft = [bbox[0], bbox[1]];

        const projection = this.findProjection(tiff, logger);
        const projProjection = getProjection(projection);
        if (projProjection == null) {
            logger.error({ tiff: tiff.source.name }, 'Failed to get tiff projection');
            throw new Error('Invalid tiff projection: ' + projection);
        }

        const points = [
            [
                projProjection.inverse(topLeft),
                projProjection.inverse(bottomLeft),
                projProjection.inverse(bottomRight),
                projProjection.inverse(topRight),
                projProjection.inverse(topLeft),
            ],
        ];

        return GeoJson.toFeaturePolygon(points, { tiff: tiff.source.name });
    }

    /** Cache the bounds lookup so we do not have to requery the bounds between CLI calls */
    private async getMetadata(tiffs: CogSource[], logger: LogType): Promise<CogBuilderBounds> {
        const cacheKey =
            path.join(
                CacheFolder,
                createHash('sha256')
                    .update(tiffs.map(c => c.name).join('\n'))
                    .digest('hex'),
            ) + '.json';

        if (existsSync(cacheKey)) {
            logger.debug({ path: cacheKey }, 'MetadataCacheHit');
            return JSON.parse(readFileSync(cacheKey).toString()) as CogBuilderBounds;
        }

        const metadata = await this.bounds(tiffs, logger);

        mkdirSync(CacheFolder, { recursive: true });
        writeFileSync(cacheKey, JSON.stringify(metadata, null, 2));
        logger.debug({ path: cacheKey }, 'MetadataCacheMiss');

        return metadata;
    }

    /**
     * Generate a list of WebMercator tiles that need to be generated to cover the source tiffs
     * @param tiffs list of tiffs to be generated
     * @returns List of QuadKey indexes for
     */
    async build(tiffs: CogSource[], logger: LogType): Promise<CogBuilderMetadata> {
        const metadata = await this.getMetadata(tiffs, logger);
        const covering = TileCover.cover(
            metadata.bounds,
            1,
            Math.min(this.maxTileZoom, metadata.resolution - 2),
            this.maxTileCount,
        );
        return { ...metadata, covering };
    }
}

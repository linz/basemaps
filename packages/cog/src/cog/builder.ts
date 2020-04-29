import { EPSG, GeoJson, Projection } from '@basemaps/geo';
import { FileOperatorSimple, LogType } from '@basemaps/lambda-shared';
import { CogSource, CogTiff, TiffTag, TiffTagGeo } from '@cogeotiff/core';
import { CogSourceFile } from '@cogeotiff/source-file';
import { createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import pLimit, { Limit } from 'p-limit';
import * as path from 'path';
import { getProjection } from '../proj';
import { Covering } from './covering';
import { JobCutline } from './job.cutline';
import { CogBuilderMetadata, SourceMetadata } from './types';

export const InvalidProjectionCode = 32767;
export const CacheFolder = './.cache';
export const proj256 = new Projection(256);
export class CogBuilder {
    q: Limit;
    maxTileCount: number;
    maxTileZoom: number;
    logger: LogType;

    /**
     * @param concurrency number of requests to run at a time
     */
    constructor(concurrency: number, maxTileCount = 25, maxTileZoom = 13, logger: LogType) {
        this.maxTileCount = maxTileCount;
        this.maxTileZoom = maxTileZoom;
        this.logger = logger;
        this.q = pLimit(concurrency);
    }

    /**
     * Get the source bounds a collection of tiffs
     * @param tiffs
     */
    async bounds(sources: CogSource[]): Promise<SourceMetadata> {
        let resolution = -1;
        let bands = -1;
        let projection: number | undefined;
        let nodata: number | undefined;
        let count = 0;
        const coordinates = sources.map((source) => {
            return this.q(async () => {
                count++;
                if (count % 50 == 0) {
                    this.logger.info({ count, total: sources.length }, 'BoundsProgress');
                }
                const tiff = new CogTiff(source);
                await tiff.init(true);
                const image = tiff.getImage(0);
                const tiffRes = this.getTiffResolution(tiff);
                if (tiffRes > resolution) {
                    resolution = tiffRes;
                }
                const tiffBandCount = image.value(TiffTag.BitsPerSample) as number[] | null;
                if (tiffBandCount != null && tiffBandCount.length > bands) {
                    bands = tiffBandCount.length;
                }

                const output = await this.getTifBounds(tiff);
                if (CogSourceFile.isSource(source)) {
                    await source.close();
                }

                const imageProjection = this.findProjection(tiff);
                if (imageProjection != null && projection != imageProjection) {
                    if (projection != null) {
                        this.logger.error(
                            {
                                firstImage: sources[0].name,
                                projection,
                                currentImage: source.name,
                                currentProjection: imageProjection,
                            },
                            'Multiple projections',
                        );
                        throw new Error('Multiple projections');
                    }
                    projection = imageProjection;
                }

                const tiffNoData = this.findNoData(tiff);
                if (tiffNoData != null && tiffNoData != nodata) {
                    if (nodata != null) throw new Error('Multiple No Data values');
                    nodata = tiffNoData;
                }

                return output;
            });
        });

        const polygons = await Promise.all(coordinates);

        if (projection == null) throw new Error('No projection detected');
        if (resolution == -1) throw new Error('No resolution detected');
        if (bands == -1) throw new Error('No image bands detected');

        return {
            projection,
            nodata,
            bands,
            bounds: GeoJson.toFeatureCollection(polygons),
            resolution,
        };
    }

    /**
     * Find the closest resolution to the tiff image
     * @param tiff
     */
    getTiffResolution(tiff: CogTiff): number {
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

    findProjection(tiff: CogTiff): EPSG {
        const image = tiff.getImage(0);

        let projection = image.valueGeo(TiffTagGeo.ProjectedCSTypeGeoKey) as number;
        if (projection != InvalidProjectionCode) {
            return projection;
        }

        const imgWkt = image.value(TiffTag.GeoAsciiParams);
        projection = Projection.parseEpsgString(imgWkt) as number;
        if (projection) {
            this.logger.trace({ tiff: tiff.source.name, imgWkt, projection }, 'GuessingProjection from GeoAsciiParams');
            return projection;
        }

        this.logger.error({ tiff: tiff.source.name }, 'Failed find projection');
        throw new Error('Failed to find projection');
    }

    /**
     * Get the nodata value stored in the source tiff
     * @param tiff
     * @param logger
     */
    findNoData(tiff: CogTiff): number | null {
        const noData: string = tiff.getImage(0).value(TiffTag.GDAL_NODATA);
        if (noData == null) {
            return null;
        }

        const noDataNum = parseInt(noData);

        if (isNaN(noDataNum) || noDataNum < 0 || noDataNum > 256) {
            this.logger.fatal({ tiff: tiff.source.name, noData }, 'Failed converting GDAL_NODATA, defaulting to 255');
            throw new Error(`Invalid GDAL_NODATA: ${noData}`);
        }

        return noDataNum;
    }

    /**
     * Generate the bounding boxes for a GeoTiff converting to WGS84
     * @param tiff
     */
    async getTifBounds(tiff: CogTiff): Promise<GeoJSON.Feature> {
        const image = tiff.getImage(0);
        const bbox = image.bbox;
        const topLeft = [bbox[0], bbox[3]];
        const topRight = [bbox[2], bbox[3]];
        const bottomRight = [bbox[2], bbox[1]];
        const bottomLeft = [bbox[0], bbox[1]];

        const projection = this.findProjection(tiff);
        const projProjection = getProjection(projection);
        if (projProjection == null) {
            this.logger.error({ tiff: tiff.source.name }, 'Failed to get tiff projection');
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
    private async getMetadata(tiffs: CogSource[]): Promise<SourceMetadata> {
        const cacheKey =
            path.join(
                CacheFolder,
                createHash('sha256')
                    .update(tiffs.map((c) => c.name).join('\n'))
                    .digest('hex'),
            ) + '.json';

        if (existsSync(cacheKey)) {
            this.logger.debug({ path: cacheKey }, 'MetadataCacheHit');
            return (await FileOperatorSimple.readJson(cacheKey)) as SourceMetadata;
        }

        const metadata = await this.bounds(tiffs);

        mkdirSync(CacheFolder, { recursive: true });
        await FileOperatorSimple.writeJson(cacheKey, metadata);
        this.logger.debug({ path: cacheKey }, 'MetadataCacheMiss');

        return metadata;
    }

    /**
     * Generate a list of WebMercator tiles that need to be generated to cover the source tiffs
     * @param tiffs list of tiffs to be generated
     * @returns List of QuadKey indexes for
     */
    async build(tiffs: CogSource[], cutline: JobCutline): Promise<CogBuilderMetadata> {
        const metadata = await this.getMetadata(tiffs);
        const covering = Covering.optimize(metadata, cutline, this.maxTileZoom, this.maxTileCount);
        return { ...metadata, covering };
    }
}

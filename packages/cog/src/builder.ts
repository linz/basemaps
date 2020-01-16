import { GeoJson, Projection } from '@basemaps/shared';
import { CogSource, CogTiff, TiffTag, TiffTagGeo } from '@cogeotiff/core';
import { CogSourceFile } from '@cogeotiff/source-file';
import pLimit, { Limit } from 'p-limit';
import { TileCover } from './cover';
import { getProjection } from './proj';

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
}

const proj256 = new Projection(256);
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
    async bounds(sources: CogSource[]): Promise<CogBuilderBounds> {
        let resolution = -1;
        let bandCount = -1;
        let projection = -1;
        const coordinates = sources.map(source => {
            return this.q(async () => {
                const tiff = new CogTiff(source);
                await tiff.init();
                const image = tiff.getImage(0);
                const tiffRes = await this.getTiffResolution(tiff);
                if (tiffRes > resolution) {
                    resolution = tiffRes;
                }
                const tiffBandCount = image.value(TiffTag.BitsPerSample) as number[] | null;
                if (tiffBandCount != null && tiffBandCount.length > bandCount) {
                    bandCount = tiffBandCount.length;
                }

                const output = await this.getTifBounds(tiff);
                if (CogSourceFile.isSource(source)) {
                    await source.close();
                }

                const imageProjection = image.geoTiffTag(TiffTagGeo.ProjectedCSTypeGeoKey) as number;
                if (imageProjection != null && imageProjection != projection) {
                    if (projection != -1) {
                        throw new Error('Multiple projections');
                    }
                    projection = imageProjection;
                }

                return output;
            });
        });

        const polygons = await Promise.all(coordinates);
        return {
            projection,
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

        await image.fetch(TiffTag.GeoKeyDirectory);

        const projection = image.geoTiffTag(TiffTagGeo.ProjectedCSTypeGeoKey) as number;
        const projProjection = getProjection(projection);
        if (projProjection == null) {
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

    /**
     * Generate a list of WebMercator tiles that need to be generated to cover the source tiffs
     * @param tiffs list of tiffs to be generated
     * @returns List of QuadKey indexes for
     */
    async build(tiffs: CogSource[]): Promise<CogBuilderMetadata> {
        const metadata = await this.bounds(tiffs);
        const covering = TileCover.cover(
            metadata.bounds,
            1,
            Math.min(this.maxTileZoom, metadata.resolution - 2),
            this.maxTileCount,
        );
        return { ...metadata, covering };
    }
}

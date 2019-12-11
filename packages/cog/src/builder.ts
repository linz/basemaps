import { CogSource, CogTiff, TiffTag, TiffTagGeo } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogSourceFile } from '@cogeotiff/source-file';
import { CogSourceUrl } from '@cogeotiff/source-url';
import pLimit, { Limit } from 'p-limit';
import { TileCover } from './cover';
import { getProjection } from './proj';
import { Projection } from '@basemaps/shared';

export interface CogBuilderMetadata {
    /** Bounding boxes for all polygons */
    bounds: GeoJSON.MultiPolygon;
    /** Quadkey indexes for the covering tiles */
    covering: string[];
    /** Lowest quality resolution for images */
    resolution: number | -1;
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
    async bounds(tiffs: string[]): Promise<{ bounds: GeoJSON.MultiPolygon; resolution: number }> {
        let resolution = -1;
        const coordinates = tiffs.map(tiffPath => {
            return this.q(async () => {
                const source = CogBuilder.createTiffSource(tiffPath);
                const tiff = new CogTiff(source);
                await tiff.init();

                const tiffRes = await this.getTiffResolution(tiff);
                if (tiffRes > resolution) {
                    resolution = tiffRes;
                }

                const output = await this.getTifBounds(tiff);
                if (CogSourceFile.isSource(source)) {
                    await source.close();
                }
                return output;
            });
        });

        return {
            bounds: {
                type: 'MultiPolygon' as const,
                coordinates: await Promise.all(coordinates),
            },
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
    async getTifBounds(tiff: CogTiff): Promise<GeoJSON.Position[][]> {
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
            projProjection.inverse(topLeft),
            projProjection.inverse(bottomLeft),
            projProjection.inverse(bottomRight),
            projProjection.inverse(topRight),
            projProjection.inverse(topLeft),
        ];
        return [points];
    }

    /**
     * Generate a list of WebMercator tiles that need to be generated to cover the source tiffs
     * @param tiffs list of tiffs to be generated
     * @returns List of QuadKey indexes for
     */
    async build(tiffs: string[]): Promise<CogBuilderMetadata> {
        const { bounds, resolution } = await this.bounds(tiffs);
        const covering = TileCover.cover(bounds, 1, Math.min(this.maxTileZoom, 3), this.maxTileCount);
        return { bounds, resolution, covering };
    }

    static createTiffSource(tiff: string): CogSource {
        if (tiff.startsWith('s3://')) {
            const source = CogSourceAwsS3.createFromUri(tiff);
            if (source == null) {
                throw new Error('Invalid URI: ' + tiff);
            }
            return source;
        } else if (tiff.startsWith('http://') || tiff.startsWith('https://')) {
            return new CogSourceUrl(tiff);
        } else {
            return new CogSourceFile(tiff);
        }
    }
}

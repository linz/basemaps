import { CogSource, CogTiff, TiffTag, TiffTagGeo } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogSourceFile } from '@cogeotiff/source-file';
import { CogSourceUrl } from '@cogeotiff/source-url';
import pLimit, { Limit } from 'p-limit';
import { TileCover } from './cover';
import { Proj2193 } from './proj';
import { Projection } from '@basemaps/shared';

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
    async bounds(tiffs: string[]): Promise<GeoJSON.MultiPolygon> {
        const coordinates = tiffs.map(tiffPath => {
            return this.q(async () => {
                const source = CogBuilder.createTiffSource(tiffPath);
                const tiff = new CogTiff(source);
                const output = await this.getTifBounds(tiff);
                if (CogSourceFile.isSource(source)) {
                    await source.close();
                }
                return output;
            });
        });

        return {
            type: 'MultiPolygon' as const,
            coordinates: await Promise.all(coordinates),
        };
    }
    /**
     * Generate the bounding boxes for a GeoTiff converting to WGS84
     * @param tif
     */
    async getTifBounds(tif: CogTiff): Promise<GeoJSON.Position[][]> {
        await tif.init();
        const image = tif.getImage(0);
        const bbox = image.bbox;
        const topLeft = [bbox[0], bbox[3]];
        const topRight = [bbox[2], bbox[3]];
        const bottomRight = [bbox[2], bbox[1]];
        const bottomLeft = [bbox[0], bbox[1]];

        await image.fetch(TiffTag.GeoKeyDirectory);
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

        const projection = image.geoTiffTag(TiffTagGeo.ProjectedCSTypeGeoKey);

        if (projection != 2193) {
            throw new Error('Invalid tiff projection: ' + projection);
        }

        return [
            [
                Proj2193.inverse(topLeft),
                Proj2193.inverse(bottomLeft),
                Proj2193.inverse(bottomRight),
                Proj2193.inverse(topRight),
                Proj2193.inverse(topLeft),
            ],
        ];
    }

    /**
     * Generate a list of WebMercator tiles that need to be generated to cover the source tiffs
     * @param tiffs list of tiffs to be generated
     * @returns List of QuadKey indexes for
     */
    async build(tiffs: string[]): Promise<string[]> {
        const bounds = await this.bounds(tiffs);
        const covering = TileCover.cover(bounds, 1, this.maxTileZoom, this.maxTileCount);
        return covering;
    }

    static createTiffSource(tiff: string): CogSource {
        if (tiff.startsWith('s3://')) {
            const parts = tiff.split('/');
            return new CogSourceAwsS3(parts[2], parts.slice(2).join('/'));
        } else if (tiff.startsWith('http://') || tiff.startsWith('https://')) {
            return new CogSourceUrl(tiff);
        } else {
            return new CogSourceFile(tiff);
        }
    }
}

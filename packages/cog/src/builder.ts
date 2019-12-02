import { CogSource, CogTiff, TiffTagGeo } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogSourceFile } from '@cogeotiff/source-file';
import { CogSourceUrl } from '@cogeotiff/source-url';
import pLimit, { Limit } from 'p-limit';
import { TileCover } from './cover';
import { Proj2193 } from './proj';

export class CogBuilder {
    q: Limit;
    cover: TileCover;

    /**
     * @param concurrency number of requests to run at a time
     */
    constructor(concurrency: number, tileCountMax = 25, tileZoomMax = 13) {
        this.q = pLimit(concurrency);
        this.cover = new TileCover(tileCountMax, tileZoomMax);
    }

    async bounds(tif: CogTiff): Promise<GeoJSON.Position[][]> {
        await tif.init();
        const image = tif.getImage(0);
        const bbox = image.bbox;
        const topLeft = [bbox[0], bbox[3]];
        const topRight = [bbox[2], bbox[3]];
        const bottomRight = [bbox[2], bbox[1]];
        const bottomLeft = [bbox[0], bbox[1]];

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
        const coordinates = tiffs.map(tiffPath => {
            const source = CogBuilder.createTiffSource(tiffPath);
            const tiff = new CogTiff(source);
            return this.q(() => this.bounds(tiff));
        });

        const geoJson = {
            type: 'MultiPolygon' as const,
            coordinates: await Promise.all(coordinates),
        };

        const covering = this.cover.cover(geoJson);

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

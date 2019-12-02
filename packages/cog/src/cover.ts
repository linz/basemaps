/* eslint-disable @typescript-eslint/camelcase */
import * as MapBoxCover from '@mapbox/tile-cover';
import { CogTiff, TiffTagGeo } from '@cogeotiff/core';
import { Proj2193 } from './proj';

export class TileCover {
    /** Max number of tiles to be a "valid" covering */
    maxTiles: number;
    /** Highest zoom level of tile to use */
    maxZoom: number;

    constructor(maxTiles: number, maxZoom: number) {
        this.maxTiles = maxTiles;
        this.maxZoom = maxZoom;
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
     * Generate a WebMercator tile cover for the supplied polygons
     * @param geometry Polygons in GeoJson WGS84
     * @returns QuadKey indexes for the covering
     */
    cover(geometry: GeoJSON.MultiPolygon): string[] {
        const limits = { min_zoom: 1, max_zoom: this.maxZoom };

        for (let i = this.maxZoom; i > 5; i--) {
            limits.max_zoom = this.maxZoom;
            const indexes = MapBoxCover.indexes(geometry, limits);
            if (indexes.length < this.maxTiles) {
                return indexes;
            }
        }
        throw new Error('Unable to find a tile covering');
    }
}

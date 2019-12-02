/* eslint-disable @typescript-eslint/camelcase */
import * as MapBoxCover from '@mapbox/tile-cover';

export class TileCover {
    /** Max number of tiles to be a "valid" covering */
    maxTiles: number;
    /** Highest zoom level of tile to use */
    maxZoom: number;

    constructor(maxTiles: number, maxZoom: number) {
        this.maxTiles = maxTiles;
        this.maxZoom = maxZoom;
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

/* eslint-disable @typescript-eslint/camelcase */
import * as MapBoxCover from '@mapbox/tile-cover';

export class TileCover {
    /**
     * Generate a WebMercator tile cover for the supplied polygons
     * @param geometry Polygons in GeoJson WGS84
     * @param minZoom Minimal zoom level tile to use
     * @param maxZoom Highest zoom level of tile to use
     * @param maxTiles Max number of tiles to be a "valid" covering
     */
    static cover(geometry: GeoJSON.MultiPolygon, minZoom = 1, maxZoom = 13, maxTiles = 5): string[] {
        const limits = { min_zoom: minZoom, max_zoom: maxZoom };

        for (let i = maxZoom; i > minZoom; i--) {
            limits.max_zoom = i;
            const indexes = MapBoxCover.indexes(geometry, limits);
            if (indexes.length < maxTiles) {
                return indexes;
            }
        }
        throw new Error('Unable to find a tile covering');
    }
}

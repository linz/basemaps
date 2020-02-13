import * as MapBoxCover from '@mapbox/tile-cover';
import { QuadKey, GeoJson } from '@basemaps/geo';
import * as Mercator from 'global-mercator';

export class TileCover {
    /**
     * Generate a WebMercator tile cover for the supplied polygons
     * @param featureCollection Polygons in GeoJson WGS84
     * @param minZoom Minimal zoom level tile to use
     * @param maxZoom Highest zoom level of tile to use
     * @param maxTiles Max number of tiles to be a "valid" covering
     */
    static cover(featureCollection: GeoJSON.FeatureCollection, minZoom = 2, maxZoom = 13, maxTiles = 25): string[] {
        /* eslint-disable @typescript-eslint/camelcase */
        const limits = { min_zoom: minZoom, max_zoom: maxZoom };

        const searchGeom: GeoJSON.MultiPolygon = GeoJson.toMultiPolygon(featureCollection.features);

        for (let i = maxZoom; i >= minZoom; i--) {
            limits.max_zoom = i;
            const indexes = MapBoxCover.indexes(searchGeom, limits)
                // Remove invalid tiles
                .filter(f => f != '')
                // Make sure the biggest tiles are first
                .sort((a: string, b: string) => a.length - b.length)
                // If an earlier tile already covers this region, we don't need this tile
                .filter((f: string, index: number, ary: string[]) => {
                    for (let i = 0; i < index; i++) {
                        if (QuadKey.intersects(f, ary[i])) {
                            return false;
                        }
                    }
                    return true;
                })
                // make the output go from 0 -> 3 and 001 -> 000111
                .sort((a: string, b: string): number => {
                    if (a.length == b.length) {
                        return a.localeCompare(b);
                    }
                    return a.length - b.length;
                });

            if (indexes.length < maxTiles) {
                return indexes;
            }
        }
        throw new Error('Unable to find a tile covering');
    }

    /** Convert a quadkey covering to a GeoJSON FeatureCollection */
    static toGeoJson(covering: string[]): GeoJSON.FeatureCollection {
        const polygons: GeoJSON.Feature[] = [];
        for (const quadKey of covering) {
            const bbox = Mercator.googleToBBox(Mercator.quadkeyToGoogle(quadKey));
            const polygon = GeoJson.toFeaturePolygon(GeoJson.toPositionPolygon(bbox), { quadKey });
            polygons.push(polygon);
        }

        return GeoJson.toFeatureCollection(polygons);
    }
}

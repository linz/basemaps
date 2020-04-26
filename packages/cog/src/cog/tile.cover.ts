import { GeoJson, QuadKey } from '@basemaps/geo';
import * as MapBoxCover from '@mapbox/tile-cover';

export const TileCover = {
    /**
     * Generate a WebMercator tile cover for the supplied polygons
     * @param polygons in GeoJson WGS84
     * @param minZoom Minimal zoom level tile to use
     * @param maxZoom Highest zoom level of tile to use
     * @param maxTiles Max number of tiles to be a "valid" covering
     */
    cover(polygons: GeoJSON.Geometry, minZoom = 2, maxZoom = 13): string[] {
        /* eslint-disable @typescript-eslint/camelcase */
        return MapBoxCover.indexes(polygons, { min_zoom: minZoom, max_zoom: maxZoom });
    },

    /** Convert a quadkey covering to a GeoJSON FeatureCollection */
    toGeoJson(covering: string[]): GeoJSON.FeatureCollection {
        const polygons: GeoJSON.Feature[] = [];
        for (const quadKey of covering) {
            const bbox = QuadKey.toBbox(quadKey);
            const polygon = GeoJson.toFeaturePolygon(GeoJson.toPositionPolygon(bbox), { quadKey });
            polygons.push(polygon);
        }

        return GeoJson.toFeatureCollection(polygons);
    },
};

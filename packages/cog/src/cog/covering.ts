import { GeoJson, QuadKey, QuadKeyTrie } from '@basemaps/geo';
import * as MapBoxCover from '@mapbox/tile-cover';
import { JobCutline } from './job.cutline';
import { SourceMetadata } from './types';

export const Covering = {
    /**
     * Generate an optimized WebMercator tile cover for the supplied polygons
     * @param featureCollection Polygons in GeoJson WGS84
     * @param minZoom Minimal zoom level tile to use
     * @param maxZoom Highest zoom level of tile to use
     * @param maxTiles Max number of tiles to be a "valid" covering
     */
    optimize(sourceMetadata: SourceMetadata, cutline: JobCutline, maxZoom = 13, maxTiles = 25): QuadKeyTrie {
        const featureCollection = sourceMetadata.bounds;
        /* eslint-disable @typescript-eslint/camelcase */
        const limits = { min_zoom: 1, max_zoom: maxZoom };

        const searchGeom: GeoJSON.MultiPolygon = GeoJson.toMultiPolygon(featureCollection.features);

        for (let i = maxZoom; i >= 1; i--) {
            limits.max_zoom = i;
            let covering = MapBoxCover.indexes(searchGeom, limits);
            // Remove invalid tiles
            covering = covering
                .filter((f) => f != '')
                // Make sure the biggest tiles are first
                .sort(QuadKey.compareKeys)
                // If an earlier tile already covers this region, we don't need this tile
                .filter((f: string, index: number, ary: string[]) => {
                    for (let i = 0; i < index; i++) {
                        if (QuadKey.intersects(f, ary[i])) {
                            return false;
                        }
                    }
                    return true;
                })
                // make the output go from 0 -> 3 and 001 -> 001111
                .sort(QuadKey.compareKeys);

            if (covering.length < maxTiles) {
                return QuadKeyTrie.fromList(covering);
            }
        }
        throw new Error('Unable to find a tile covering');
    },
};

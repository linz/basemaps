import { Epsg, GeoJson, QuadKey, Tile, TileMatrixSet } from '@basemaps/geo';
import { LatLon } from '@basemaps/geo/build/projection';
import { getProjection } from '../proj';

export const TmsUtil = {
    /** Convert a quadkey to a BBox in Wsg84 units */
    tileToLatLon(tms: TileMatrixSet, tile: Tile): LatLon {
        const { forward } = getProjection(tms.projection, Epsg.Wgs84);
        const point = tms.tileToSource(tile);
        const [lon, lat] = forward([point.x, point.y]);
        return { lat, lon };
    },

    /** Convert a quadkey covering to a GeoJSON FeatureCollection */
    toGeoJson(tms: TileMatrixSet, covering: string[]): GeoJSON.FeatureCollection {
        const polygons: GeoJSON.Feature[] = [];
        for (const quadKey of covering) {
            const tile = QuadKey.toTile(quadKey);
            const polygon = GeoJson.toFeaturePolygon(
                [
                    [
                        [tile.x, tile.y + 1],
                        [tile.x, tile.y],
                        [tile.x + 1, tile.y],
                        [tile.x + 1, tile.y + 1],
                        [tile.x, tile.y + 1],
                    ].map(([x, y]) => {
                        const { lat, lon } = this.tileToLatLon(tms, { x, y, z: tile.z });
                        return [lon, lat];
                    }),
                ],
                { quadKey },
            );
            polygons.push(polygon);
        }

        return GeoJson.toFeatureCollection(polygons);
    },
};

import { Bounds, Epsg, GeoJson, QuadKey, Tile, TileMatrixSet } from '@basemaps/geo';
import { getProjection, Converter } from '../proj';
import { Position } from 'geojson';

export interface LatLon {
    lat: number;
    lon: number;
}

export const TmsUtil = {
    /** Convert a tile to a BBox in Wsg84 units */
    tileToSourceBounds(tms: TileMatrixSet, tile: Tile): Bounds {
        const ul = tms.tileToSource(tile);
        const lr = tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });
        return new Bounds(ul.x, lr.y, Math.abs(lr.x - ul.x), Math.abs(lr.y - ul.y));
    },

    /**
     * Convert a tile to a GeoJson Polygon in Source units
     */
    tileToPolygon(tms: TileMatrixSet, tile: Tile): Position[][] {
        return [
            [
                [tile.x, tile.y + 1],
                [tile.x, tile.y],
                [tile.x + 1, tile.y],
                [tile.x + 1, tile.y + 1],
                [tile.x, tile.y + 1],
            ].map(([x, y]) => {
                const p = tms.tileToSource({ x, y, z: tile.z });
                return [p.x, p.y];
            }),
        ];
    },

    getProjection(tms: TileMatrixSet): Converter {
        return getProjection(tms.projection, Epsg.Wgs84);
    },

    /** Convert a quadkey covering to a GeoJSON FeatureCollection */
    toGeoJson(tms: TileMatrixSet, covering: string[]): GeoJSON.FeatureCollection {
        const { forward } = this.getProjection(tms);
        const polygons: GeoJSON.Feature[] = [];
        for (const quadKey of covering) {
            const tile = QuadKey.toTile(quadKey);
            const polygon = GeoJson.toFeaturePolygon([this.tileToPolygon(tms, tile)[0].map((p) => forward(p))], {
                quadKey,
            });
            polygons.push(polygon);
        }

        return GeoJson.toFeatureCollection(polygons);
    },
};

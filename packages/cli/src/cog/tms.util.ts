import { Epsg, GeoJson, QuadKey, Tile, TileMatrixSet, Bounds } from '@basemaps/geo';
import { getProjection } from '../proj';

export interface LatLon {
    lat: number;
    lon: number;
}

export const TmsUtil = {
    /** Convert a tile to a BBox in Wsg84 units */
    tileToLatLon(tms: TileMatrixSet, tile: Tile): LatLon {
        const { forward } = getProjection(tms.projection, Epsg.Wgs84);
        const point = tms.tileToSource(tile);
        const [lon, lat] = forward([point.x, point.y]);
        return { lat, lon };
    },

    /** Convert a tile to a BBox in Wsg84 units */
    tileToWsg84Bounds(tms: TileMatrixSet, tile: Tile): Bounds {
        const ul = this.tileToLatLon(tms, tile);
        const lr = this.tileToLatLon(tms, { x: tile.x + 1, y: tile.y + 1, z: tile.z });
        return new Bounds(ul.lon, lr.lat, Math.abs(lr.lon - ul.lon), Math.abs(lr.lat - ul.lat));
    },

    /**
     * Convert a tile to a GeoJson Polygon in Wsg84 units
     */
    tileToPolygon(tms: TileMatrixSet, tile: Tile): [number, number][][] {
        return [
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
        ];
    },

    /** Convert a quadkey covering to a GeoJSON FeatureCollection */
    toGeoJson(tms: TileMatrixSet, covering: string[]): GeoJSON.FeatureCollection {
        const polygons: GeoJSON.Feature[] = [];
        for (const quadKey of covering) {
            const tile = QuadKey.toTile(quadKey);
            const polygon = GeoJson.toFeaturePolygon(this.tileToPolygon(tms, tile), { quadKey });
            polygons.push(polygon);
        }

        return GeoJson.toFeatureCollection(polygons);
    },
};

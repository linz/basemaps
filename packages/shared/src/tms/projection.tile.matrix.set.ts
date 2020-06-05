import { Bounds, Epsg, GeoJson, QuadKey, Tile, TileMatrixSet, EpsgCode } from '@basemaps/geo';
import * as proj4 from 'proj4';
import { Position } from 'geojson';
import { Nztm2000 } from './nztm2000';
import { Citm2000 } from './citm2000';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Nztm2000Tms } from '@basemaps/geo/build/tms/nztm2000';
import { CompositeError } from '../composite.error';

export interface LatLon {
    lat: number;
    lon: number;
}

proj4.defs(Epsg.Nztm2000.toEpsgString(), Nztm2000);
proj4.defs(Epsg.Citm2000.toEpsgString(), Citm2000);

const CodeMap = new Map<EpsgCode, ProjectionTileMatrixSet>();

export class ProjectionTileMatrixSet {
    tms: TileMatrixSet;
    private projection: proj4.Converter;

    constructor(tms: TileMatrixSet) {
        this.tms = tms;
        try {
            this.projection = proj4(tms.projection.toEpsgString(), Epsg.Wgs84.toEpsgString());
        } catch (err) {
            throw new CompositeError(
                `Failed to create projection: ${tms.projection.toEpsgString()}, ${Epsg.Wgs84.toEpsgString()}`,
                err,
            );
        }
    }

    static get(epsgCode: EpsgCode): ProjectionTileMatrixSet {
        const ptms = CodeMap.get(epsgCode);
        if (ptms != null) return ptms;
        throw new Error(`Invalid projection: ${epsgCode}`);
    }

    static tryGet(epsgCode?: EpsgCode): ProjectionTileMatrixSet | null {
        return (epsgCode && CodeMap.get(epsgCode)) ?? null;
    }

    get toWsg84(): (coordinates: Position) => Position {
        return this.projection.forward;
    }

    get fromWsg84(): (coordinates: Position) => Position {
        return this.projection.inverse;
    }

    /** Convert a tile to a BBox in Wsg84 units */
    tileToSourceBounds(tile: Tile): Bounds {
        const ul = this.tms.tileToSource(tile);
        const lr = this.tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });
        return new Bounds(ul.x, lr.y, Math.abs(lr.x - ul.x), Math.abs(lr.y - ul.y));
    }

    /**
     * return the `lat`, `lon` of a Tile's center
     */
    tileCenterToLatLon(tile: Tile): LatLon {
        const point = this.tms.tileToSource({ x: tile.x + 0.5, y: tile.y + 0.5, z: tile.z });
        const [lon, lat] = this.toWsg84([point.x, point.y]);
        return { lat, lon };
    }

    /**
     * Convert a tile to a GeoJson Polygon in Source units
     */
    tileToPolygon(tile: Tile): Position[][] {
        return [
            [
                [tile.x, tile.y + 1],
                [tile.x, tile.y],
                [tile.x + 1, tile.y],
                [tile.x + 1, tile.y + 1],
                [tile.x, tile.y + 1],
            ].map(([x, y]) => {
                const p = this.tms.tileToSource({ x, y, z: tile.z });
                return [p.x, p.y];
            }),
        ];
    }

    /** Convert a quadkey covering to a GeoJSON FeatureCollection */
    toGeoJson(covering: string[]): GeoJSON.FeatureCollection {
        const { forward } = this.projection;
        const polygons: GeoJSON.Feature[] = [];
        for (const quadKey of covering) {
            const tile = QuadKey.toTile(quadKey);
            const polygon = GeoJson.toFeaturePolygon([this.tileToPolygon(tile)[0].map((p) => forward(p))], {
                quadKey,
            });
            polygons.push(polygon);
        }

        return GeoJson.toFeatureCollection(polygons);
    }
}

CodeMap.set(EpsgCode.Google, new ProjectionTileMatrixSet(GoogleTms));
CodeMap.set(EpsgCode.Nztm2000, new ProjectionTileMatrixSet(Nztm2000Tms));

import { Bounds, Epsg, EpsgCode, GeoJson, Tile, TileMatrixSet, TileMatrixSetQuadKey } from '@basemaps/geo';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Nztm2000Tms } from '@basemaps/geo/build/tms/nztm2000';
import { Position } from 'geojson';
import * as proj4 from 'proj4';
import { CompositeError } from '../composite.error';
import { Citm2000 } from './citm2000';
import { Nztm2000 } from './nztm2000';

export interface LatLon {
    lat: number;
    lon: number;
}

proj4.defs(Epsg.Nztm2000.toEpsgString(), Nztm2000);
proj4.defs(Epsg.Citm2000.toEpsgString(), Citm2000);

const CodeMap = new Map<EpsgCode, ProjectionTileMatrixSet>();

export class ProjectionTileMatrixSet {
    /** The underlying TileMatrixSet */
    tms: TileMatrixSet;
    /** Used to calculate `BlockSize  = blockFactor * tms.tileSize` for generating COGs */
    blockFactor: number;

    /** Transform coordinates to and from Wsg84 */
    private projection: proj4.Converter;

    /**
     * Wrapper around TileMatrixSet with utilities for converting Points and Polygons
     */
    constructor(tms: TileMatrixSet, blockFactor = 2) {
        this.tms = tms;
        this.blockFactor = blockFactor;
        try {
            this.projection = proj4(tms.projection.toEpsgString(), Epsg.Wgs84.toEpsgString());
        } catch (err) {
            throw new CompositeError(
                `Failed to create projection: ${tms.projection.toEpsgString()}, ${Epsg.Wgs84.toEpsgString()}`,
                err,
            );
        }
    }

    /**
     * Get the ProjectionTileMatrixSet instance for a specified code,
     *
     * throws a exception if the code is not recognized
     *
     * @param epsgCode
     */
    static get(epsgCode: EpsgCode): ProjectionTileMatrixSet {
        const ptms = CodeMap.get(epsgCode);
        if (ptms != null) return ptms;
        throw new Error(`Invalid projection: ${epsgCode}`);
    }

    /**
     * Try to find a corresponding ProjectionTileMatrixSet for a number
     * @param epsgCode
     */
    static tryGet(epsgCode?: EpsgCode): ProjectionTileMatrixSet | null {
        return (epsgCode && CodeMap.get(epsgCode)) ?? null;
    }

    /**
     * Convert source `[x, y]` coordinates to `[lon, lat]`
     */
    get toWsg84(): (coordinates: Position) => Position {
        return this.projection.forward;
    }

    /**
     * Convert `[lon, lat]` coordinates to source `[x, y]`
     */
    get fromWsg84(): (coordinates: Position) => Position {
        return this.projection.inverse;
    }

    /** Convert a tile to a BBox in source units */
    tileToSourceBounds(tile: Tile): Bounds {
        const ul = this.tms.tileToSource(tile);
        const lr = this.tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });
        return new Bounds(Math.min(ul.x, lr.x), Math.min(ul.y, lr.y), Math.abs(lr.x - ul.x), Math.abs(lr.y - ul.y));
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
        const { toWsg84 } = this;
        const polygons: GeoJSON.Feature[] = [];
        const tmsQk = new TileMatrixSetQuadKey(this.tms);
        for (const quadKey of covering) {
            const tile = tmsQk.toTile(quadKey);
            const polygon = GeoJson.toFeaturePolygon([this.tileToPolygon(tile)[0].map((p) => toWsg84(p))], {
                quadKey,
            });
            polygons.push(polygon);
        }

        return GeoJson.toFeatureCollection(polygons);
    }

    /**
     * Find the number of alignment levels required to render the tile. Min 1
     *
     * @param tile
     * @param sourceZoom the zoom level for the source imagery
     * @param blockSize defaults to tileSize. the number of pixels being rendered per tile
     */
    findAlignmentLevels(tile: Tile, sourceZoom: number): number {
        const denom = this.blockFactor * this.blockFactor * this.tms.tileSize;
        return Math.max(0, Math.floor(Math.log2(this.getImagePixelWidth(tile, sourceZoom) / denom)) - tile.z);
    }

    /**
     * Return the expected width in pixels of an image at the tile resolution. Uses
     * `this.blockFactor` for HiDPI tiles.

     * @param sourceZoom The zoom level for the source imagery
     * @param tileZoom The zoom level for the quadKey @param blockSize size of each tile.
     */
    getImagePixelWidth(tile: Tile, sourceZoom: number): number {
        const ul = this.tms.tileToSource(tile);
        const lr = this.tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });
        return Math.round((lr.x - ul.x) / this.tms.pixelScale(sourceZoom)) * this.blockFactor;
    }
}

CodeMap.set(EpsgCode.Google, new ProjectionTileMatrixSet(GoogleTms));
CodeMap.set(EpsgCode.Nztm2000, new ProjectionTileMatrixSet(Nztm2000Tms));

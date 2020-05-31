import { GeoJson, BoundingBox, Epsg } from '@basemaps/geo';
import { getProjection } from '../proj';
import { QuadTrie } from './quad.trie';

/**
 * Split a quuadKey into an x and y component
 */
function quadKeyToTile(qk: string): [number, number] {
    let x = 0;
    let y = 0;
    for (let i = 0; i < qk.length; ++i) {
        const k = qk[i];
        x = x << 1;
        y = y << 1;
        if (k === '1' || k === '3') {
            x = x | 1;
        }
        if (k === '2' || k === '3') {
            y = y | 1;
        }
    }

    return [x, y];
}

const Codes = new Map<number, TileGrid>();

export class TileGrid implements BoundingBox {
    epsg: Epsg;
    x: number;
    y: number;
    width: number;
    height: number;
    private _toWsg84?: proj4.Converter;

    static Google = new TileGrid(Epsg.Google, {
        x: -20037508.3427892,
        y: -20037508.3427892,
        width: 20037508.3427892 * 2,
        height: 20037508.3427892 * 2,
    });

    /**
     * Create a TileGrid suitable for creating quadKeys for a given bounds and precision

     * @param bounds The boundary of the `TileGrid`
     */
    constructor(epsg: Epsg, bounds: BoundingBox) {
        this.epsg = epsg;
        this.x = bounds.x;
        this.y = bounds.y;
        this.width = bounds.width;
        this.height = bounds.height;
    }

    /**
     * Return the `TileGrid` for the `EPSG` projection.
     */
    static get(code: number): TileGrid {
        const tg = Codes.get(code);
        if (tg == null) throw new Error('Invalid EPSG code: ' + code);
        return tg;
    }

    static quadKeyToXyz(quadKey: string): [number, number, number] {
        const [x, y] = quadKeyToTile(quadKey);
        return [x, y, quadKey.length];
    }

    get toWsg84(): proj4.Converter {
        if (this._toWsg84 == null) {
            const _projection = getProjection(this.epsg, Epsg.Wgs84);
            if (_projection == null) throw new Error('Invalid prohection! ' + this.epsg.code);
            this._toWsg84 = _projection;
        }
        return this._toWsg84;
    }

    /**
     * Return the bounding box of a `quadKey` in the units of this `TileGrid`
     * @param quadKey a quadKey relative to this `TileGrid`
     */
    quadKeyToBbox(qk: string): [number, number, number, number] {
        const tcount = 1 << qk.length;
        const [qx, qy] = quadKeyToTile(qk);
        const fx = this.width / tcount;
        const fy = this.height / tcount;
        return [
            this.x + qx * fx,
            this.y + this.height - qy * fy,
            this.x + (qx + 1) * fx,
            this.y + this.height - (qy + 1) * fy,
        ];
    }

    /**
     * Return the `quadKey` of `z` length for coordinates `x`, `y`
     * @param x in the units of this `TileGrid`
     * @param y in the units of this `TileGrid`
     * @param z
     */
    quadKey(x: number, y: number, z: number): string {
        let level = 1 << z;
        if (x < 0 || x > level || y < 0 || y > level) return '';

        let qk = '';
        let hl = 0;
        let mask = 0;
        while (level > 1) {
            hl = level >> 1;
            mask = hl - 1;

            if (x < hl) {
                qk += y < hl ? '0' : '2';
            } else {
                qk += y < hl ? '1' : '3';
            }
            level = hl;
            x &= mask;
            y &= mask;
        }
        return qk;
    }

    /** Convert a quadkey covering to a GeoJSON FeatureCollection in WSG84

     * @param covering a list of quadKeys or a `QuadTrie`
     */
    toGeoJson(covering: string[] | QuadTrie): GeoJSON.FeatureCollection {
        const toWgs84 = this.toWsg84.forward;
        const polygons: GeoJSON.Feature[] = [];
        for (const quadKey of covering) {
            const poly = GeoJson.toPositionPolygon(this.quadKeyToBbox(quadKey))[0].map(toWgs84);
            const polygon = GeoJson.toFeaturePolygon([poly], { quadKey });
            polygons.push(polygon);
        }

        return GeoJson.toFeatureCollection(polygons);
    }
}

Codes.set(
    Epsg.Nztm2000.code,
    ((): TileGrid => {
        const { forward } = getProjection(Epsg.Wgs84, Epsg.Nztm2000)!;
        const [x, y] = forward([166.37, -47.3]);
        const [ex, ey] = forward([178.63, -34.1]);
        return new TileGrid(Epsg.Nztm2000, {
            x,
            y,
            width: ex - x,
            height: ey - y,
        });
    })(),
);

Codes.set(Epsg.Google.code, TileGrid.Google);

import { GeoJson, QuadKeyTrie, BoundingBox, Epsg } from '@basemaps/geo';
import { getProjection } from '../proj';

type Position = number[];

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

/**
 * Fill a polygon (in tile units) with QuadKeys returning a `QuadKeyTrie`
 */
function fill(poly: Position[], bbox: number[], trie = new QuadKeyTrie(), z: number, minKeysize = 1): QuadKeyTrie {
    const [minX, minY, maxX, maxY] = bbox;
    const polyLen = poly.length;

    // for each row
    for (let row = minY; row <= maxY; ++row) {
        const xrow: number[] = [];
        //  Build a list of nodes.
        let j = polyLen - 1;
        for (let i = 0; i < polyLen; i++) {
            const yi = poly[i][1];
            const yj = poly[j][1];
            if ((yi < row && yj >= row) || (yj < row && yi >= row)) {
                const xi = poly[i][0];
                const xj = poly[j][0];
                let lx = Math.floor(xi + ((row - yi) / (yj - yi)) * (xj - xi));
                if ((yi < row && yj < row + 1) || (yj < row && yi < row + 1)) {
                    let tx = lx;
                    if (yi > row && yi < row + 1) {
                        if (xi < lx) {
                            lx = Math.floor(xi);
                        } else {
                            tx = Math.floor(xi);
                        }
                    } else if (xj < lx) {
                        lx = Math.floor(xj);
                    } else {
                        tx = Math.floor(xj);
                    }
                    trie.fillRow(lx, tx, row, z, minKeysize);
                    // corner
                } else {
                    let ux = Math.floor(xi + ((row + 1 - yi) / (yj - yi)) * (xj - xi));
                    if (ux < lx) {
                        const swap = ux;
                        ux = lx;
                        lx = swap;
                    }

                    trie.fillRow(lx, ux, row, z, minKeysize);
                }

                xrow.push(Math.floor(lx));
            } else if (yi >= row && yi < row + 1) {
                let xi = poly[i][0];
                let xj = poly[j][0];
                if (yj < row) {
                    xj = xi + ((row - yi) / (yj - yi)) * (xj - xi);
                } else if (yj >= row + 1) {
                    xj = xi + ((row + 1 - yi) / (yj - yi)) * (xj - xi);
                }
                if (xj < xi) {
                    const swap = xi;
                    xi = xj;
                    xj = swap;
                }

                trie.fillRow(Math.floor(xi), Math.floor(xj), row, z, minKeysize);
            }
            j = i;
        }
        const lastx = xrow.length - 1;
        if (lastx == -1) {
            continue;
        }

        //  Sort the nodes, via a simple “Bubble” sort.
        let i = 0;
        while (i < lastx) {
            if (xrow[i] > xrow[i + 1]) {
                const swap = xrow[i];
                xrow[i] = xrow[i + 1];
                xrow[i + 1] = swap;
                if (i != 0) i--;
            } else {
                i++;
            }
        }

        //  Fill the tiles between node pairs.
        for (i = 0; i <= lastx; i += 2) {
            const px = xrow[i];
            if (px > maxX) break;
            const ex = xrow[i + 1];
            if (ex != px) {
                trie.fillRow((px < minX ? minX : px) + 1, (ex > maxX ? maxX : ex) - 1, row, z, minKeysize);
            }
        }
    }

    return trie;
}

export class TileGridLevel {
    extent: TileGrid;
    /** The zoom level */
    x: number;
    y: number;
    z: number;
    /** The number of tiles wide and high of this `TileGrid` (`2**z`) */
    xRatio: number;
    yRatio: number;

    /**
     *
     * @param z The zoom level determines how long quadKeys will be and what size a tile will be
     */
    constructor(extent: TileGrid, z: number) {
        this.extent = extent;
        this.x = extent.x;
        this.y = extent.y;
        this.z = z;
        const dim = 1 << z;
        this.xRatio = dim / extent.width;
        this.yRatio = dim / extent.height;
    }

    /**
     * Convert a Position that is relative to this `TileGrid` to a fractional tile with `(0,0)`
     * being the `x,y` of the bounds.

     * @param coord the coordoinates to convert to fractional tile
     */
    fraction(coord: Position): Position {
        return [(coord[0] - this.x) * this.xRatio, (coord[1] - this.y) * this.yRatio];
    }

    /**
     * Convert `polygon` to a `QuadKeyTrie`
     * @param polygon A single polygon in the units of this `TileGrid`
     */
    coverPolygon(polygon: Position[], minKeysize = 1): QuadKeyTrie {
        const trie = new QuadKeyTrie();

        if (polygon.length < 3) return trie;

        const convert = this.extent.toWsg84.inverse;

        let p = this.fraction(convert(polygon[0]));
        let pi = [Math.floor(p[0]), Math.floor(p[1])];

        const bbox = [pi[0], pi[1], pi[0], pi[1]];

        const lp: Position[] = [p];
        let li = 0;

        for (let i = 1; i < polygon.length; ++i) {
            const c = this.fraction(convert(polygon[i]));
            const ci = [Math.floor(c[0]), Math.floor(c[1])];
            if (ci[0] != pi[0] || ci[1] != pi[1]) {
                if (bbox[0] > ci[0]) bbox[0] = ci[0];
                if (bbox[2] < ci[0]) bbox[2] = ci[0];
                if (bbox[1] > ci[1]) bbox[1] = ci[1];
                if (bbox[3] < ci[1]) bbox[3] = ci[1];
                if (i - 1 !== li) lp.push(p);
                lp.push(c);
                li = i;
            }
            p = c;
            pi = ci;
        }

        return fill(lp, bbox, trie, this.z, minKeysize);
    }
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
    quadKeyToBbox(qk: string): number[] {
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

     * @param covering a list of quadKeys or a `QuadKeyTrie`
     */
    toGeoJson(covering: string[] | QuadKeyTrie): GeoJSON.FeatureCollection {
        const toWgs84 = this.toWsg84.forward;
        const polygons: GeoJSON.Feature[] = [];
        for (const quadKey of covering) {
            const poly = GeoJson.toPositionPolygon(this.quadKeyToBbox(quadKey))[0].map(toWgs84);
            const polygon = GeoJson.toFeaturePolygon([poly], { quadKey });
            polygons.push(polygon);
        }

        return GeoJson.toFeatureCollection(polygons);
    }

    getLevel(z: number): TileGridLevel {
        return new TileGridLevel(this, z);
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

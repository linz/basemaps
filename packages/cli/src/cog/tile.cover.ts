import { QuadTrie } from './quad.trie';
import { TileGrid } from './tile.grid';

type Position = number[];

/**
 * Fill top or bottom nearly horizontal edges
 */
function fillEdgeCase(trie: QuadTrie, row: number, yi: number, lx: number, xi: number, xj: number, z: number): void {
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
    trie.fillRow(lx, tx, row, z);
}

function xIntersetPoint(row: number, xi: number, xj: number, yi: number, yj: number): number {
    return Math.floor(xi + ((row - yi) / (yj - yi)) * (xj - xi));
}

/**
 * Fill a polygon (in tile units) with QuadKeys returning a `QuadTrie`

 * This is a standard polygon fill with extensions to ensure all polygon edges are completely
 * covered by a tile.
 */
function fill(poly: Position[], bbox: number[], trie = new QuadTrie(), z: number): QuadTrie {
    const [minX, minY, maxX, maxY] = bbox;
    const polyLen = poly.length;

    // For each row find the xpoints that cross the bottom of the row (`xrow`) and fill in the edge
    // of the polygon
    for (let row = minY; row <= maxY; ++row) {
        const top = row + 1;
        const xrow: number[] = [];
        //  Build a list of nodes.
        let j = polyLen - 1;
        for (let i = 0; i < polyLen; i++) {
            const yi = poly[i][1];
            const yj = poly[j][1];
            if ((yi < row && yj >= row) || (yj < row && yi >= row)) {
                // Line crosses row bottom
                const xi = poly[i][0];
                const xj = poly[j][0];
                const lx = xIntersetPoint(row, xi, xj, yi, yj);
                if ((yi < row && yj < top) || (yj < row && yi < top)) {
                    // Line does not cross row top
                    fillEdgeCase(trie, row, yi, lx, xi, xj, z);
                } else {
                    //  Line crosses row top
                    const ux = xIntersetPoint(top, xi, xj, yi, yj);
                    trie.fillRow(lx, ux, row, z);
                }

                xrow.push(Math.floor(lx)); // Need to fill polygon
            } else if ((yi < top && yj >= row) || (yj < top && yi >= row)) {
                // Line touches row quadrant
                const xi = poly[i][0];
                const xj = poly[j][0];
                const ux = xIntersetPoint(top, xi, xj, yi, yj);
                if ((yi < top && yj >= top) || (yj < top && yi >= top)) {
                    // Line crosses row top
                    fillEdgeCase(trie, row, yi, ux, xi, xj, z);
                } else {
                    // Line within row quadrant
                    trie.fillRow(Math.floor(xi), Math.floor(xj), row, z);
                }
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
                trie.fillRow((px < minX ? minX : px) + 1, (ex > maxX ? maxX : ex) - 1, row, z);
            }
        }
    }

    return trie;
}

export class TileCover {
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
     * Convert `polygon` to a `QuadTrie`
     * @param polygon A single polygon in the units of this `TileGrid`
     */
    coverPolygon(polygon: Position[]): QuadTrie {
        const trie = new QuadTrie();

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
                // calculate bounding box
                if (bbox[0] > ci[0]) bbox[0] = ci[0];
                if (bbox[2] < ci[0]) bbox[2] = ci[0];
                if (bbox[1] > ci[1]) bbox[1] = ci[1];
                if (bbox[3] < ci[1]) bbox[3] = ci[1];

                // store only the entry and exit points to a tile
                if (i - 1 !== li) lp.push(p);
                lp.push(c);
                li = i;
            }
            p = c;
            pi = ci;
        }

        return fill(lp, bbox, trie, this.z);
    }
}

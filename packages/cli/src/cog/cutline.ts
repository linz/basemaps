import { Bounds, Epsg, GeoJson, Tile, TileMatrixSet } from '@basemaps/geo';
import { compareName, FileOperator, NamedBounds, ProjectionTileMatrixSet } from '@basemaps/shared';
import { FeatureCollection, Position } from 'geojson';
import { basename } from 'path';
import pc, { MultiPolygon, Polygon, Ring } from 'polygon-clipping';
import { CoveringFraction, MaxImagePixelWidth } from './constants';
import { CogJob, SourceMetadata } from './types';
const { intersection, union } = pc;

/** Padding to always apply to image boundies */
const PixelPadding = 100;

function findGeoJsonProjection(geojson: any | null): Epsg {
    return Epsg.parse(geojson?.crs?.properties?.name ?? '') ?? Epsg.Wgs84;
}

function polysSameShape(a: Polygon, b: Polygon): boolean {
    if (a.length != b.length) return false;
    for (let i = 0; i < a.length; ++i) {
        if (a[i].length != b[i].length) return false;
    }
    return true;
}

function namedBounds(tms: TileMatrixSet, tile: Tile): NamedBounds {
    return { name: TileMatrixSet.tileToName(tile), ...tms.tileToSourceBounds(tile).toJson() };
}

function addNonDupes(list: Tile[], addList: Tile[]): void {
    const len = list.length;
    for (const add of addList) {
        let i = 0;
        for (; i < len; ++i) {
            const curr = list[i];
            if (curr.x == add.x && curr.y == add.y && curr.z == add.z) {
                break;
            }
        }
        if (i == len) {
            list.push(add);
        }
    }
}

export class Cutline {
    clipPoly: MultiPolygon = [];
    targetProj: ProjectionTileMatrixSet;
    blend: number;
    tms: TileMatrixSet; // convience to targetProj.tms

    /**
     * Create a Cutline instance from a `GeoJSON FeatureCollection`.

     * @param targetProj the projection the COGs will be created in.

     * @param clipPoly the optional cutline. The source imagery outline used by default. This
     * `FeatureCollection` is converted to one `MultiPolygon` with any holes removed and the
     * coordinates transposed from `Wsg84` to the target projection.

     * @param blend How much blending to consider when working out boundaries.
     */
    constructor(targetProj: ProjectionTileMatrixSet, clipPoly?: FeatureCollection, blend = 0) {
        this.targetProj = targetProj;
        this.tms = targetProj.tms;
        this.blend = blend;
        if (clipPoly == null) {
            return;
        }
        if (findGeoJsonProjection(clipPoly) !== Epsg.Wgs84) {
            throw new Error('Invalid geojson; CRS may not be set for cutline!');
        }
        const { fromWsg84 } = this.targetProj;
        for (const { geometry } of clipPoly.features) {
            if (geometry.type === 'MultiPolygon') {
                for (const coords of geometry.coordinates) {
                    this.clipPoly.push([coords[0].map(fromWsg84) as Ring]);
                }
            } else if (geometry.type === 'Polygon') {
                this.clipPoly.push([geometry.coordinates[0].map(fromWsg84) as Ring]);
            }
        }
    }

    /**
     * Load a geojson cutline from the file-system.
     *
     * @param path the path of the cutline to load. Can be `s3://` or local file path.
     */
    static loadCutline(path: string): Promise<FeatureCollection> {
        return FileOperator.create(path).readJson(path) as Promise<FeatureCollection>;
    }

    /**
     * For the given tile `name`, filter `job.source.files` and cutline polygons that are within bounds plus
     * padding
     *
     * @param name
     * @param job
     * @param  sourceGeo
     */
    filterSourcesForName(name: string, job: CogJob, sourceGeo: FeatureCollection): void {
        const tile = TileMatrixSet.nameToTile(name);
        const qkBounds = this.targetProj.tileToSourceBounds(tile);
        const qkPadded = this.padBounds(qkBounds, job.source.resZoom);

        const srcTiffs = new Set<string>();

        for (const f of sourceGeo.features) {
            const { geometry } = f;
            if (geometry.type === 'Polygon') {
                const srcBounds = this.sourceWsg84PolyToBounds(geometry.coordinates[0]);
                if (qkPadded.intersects(srcBounds)) {
                    srcTiffs.add(basename(f.properties!.tiff!));
                }
            }
        }
        job.source.files = job.source.files.filter((path) => srcTiffs.has(basename(path)));

        if (this.clipPoly.length > 0) {
            const boundsPoly = GeoJson.toPositionPolygon(qkPadded.toBbox()) as Polygon;
            const poly = intersection(boundsPoly, this.clipPoly);
            if (poly == null || poly.length == 0) {
                // this tile is not needed
                this.clipPoly = [];
                job.source.files = [];
            } else if (
                poly.length == 1 &&
                polysSameShape(poly[0], boundsPoly) &&
                this.sourcePolyToBounds(poly[0][0]).containsBounds(qkBounds)
            ) {
                // tile is completely surrounded; no cutline polygons needed
                this.clipPoly = [];
            } else {
                // set the cutline polygons to just the area of interest
                this.clipPoly = poly;
            }
        }
    }

    /**
     * Generate an optimized WebMercator tile cover for the supplied polygons
     * @param featureCollection Source TIff Polygons in GeoJson WGS84
     */
    optimizeCovering(sourceMetadata: SourceMetadata): NamedBounds[] {
        const srcArea = this.findCovering(sourceMetadata);

        const { resZoom } = sourceMetadata;
        // Look for the biggest tile size we are allowed to create.
        let minZ = resZoom - 1;
        while (minZ > 1 && this.targetProj.getImagePixelWidth({ x: 0, y: 0, z: minZ }, resZoom) < MaxImagePixelWidth) {
            --minZ;
        }
        minZ = Math.max(1, minZ + 1);

        let tiles: Tile[] = [];
        const { tms } = this.targetProj;

        for (const tile of tms.topLevelTiles()) {
            // Don't make COGs with a tile.z < minZ.
            tiles = tiles.concat(this.makeTiles(tile, srcArea, minZ, CoveringFraction).tiles);
        }

        if (tiles.length == 0) {
            throw new Error('Source imagery does not overlap with project extent');
        }

        const covering = tiles.map((tile) => namedBounds(tms, tile));
        // remove duplicate
        return covering
            .filter((curr) => {
                for (const other of covering) {
                    if (other !== curr && Bounds.contains(other, curr)) return false;
                }
                return true;
            })
            .sort(compareName);
    }

    /**
     * Convert JobCutline to geojson FeatureCollection
     */
    toGeoJson(clipPoly = this.clipPoly): FeatureCollection {
        const { toWsg84 } = this.targetProj;
        return GeoJson.toFeatureCollection([GeoJson.toFeatureMultiPolygon(clipPoly.map((p) => [p[0].map(toWsg84)]))]);
    }

    /**
     * Convert a Wsg84 "square" polygon to it's bounds
     */
    private sourcePolyToBounds(poly: Position[]): Bounds {
        const [x1, y1] = poly[0];
        const [x2, y2] = poly[2];

        return new Bounds(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    }

    /**
     * Convert a Wsg84 polygon to it's bounds
     */
    private sourceWsg84PolyToBounds(poly: Position[]): Bounds {
        const { fromWsg84 } = this.targetProj;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const p of poly) {
            const [x, y] = fromWsg84(p);
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

        return new Bounds(minX, minY, maxX - minX, maxY - minY);
    }

    /**
     * Merge child nodes that have at least a covering fraction
     * @param tile the tile to descend
     * @param srcArea the aread of interest
     * @param minZ Only produce tiles for zoom levels at least `minZ` and no sibling tiles
     * greater than `minZ +2`
     * @param coveringFraction merge tiles that cover at least this fraction
     * @return the tiles and fraction covered of the tile by this srcArea
     */
    private makeTiles(
        tile: Tile,
        srcArea: MultiPolygon,
        minZ: number,
        coveringFraction: number,
    ): { tiles: Tile[]; fractionCovered: number } {
        const clip = this.targetProj.tileToPolygon(tile) as Polygon;
        const intArea = intersection(srcArea, clip);

        if (intArea.length == 0) {
            return { tiles: [], fractionCovered: 0 };
        }
        if (tile.z == minZ + 4) {
            return { tiles: [tile], fractionCovered: 1 };
        }

        const ans = { tiles: [] as Tile[], fractionCovered: 0 };

        for (const child of this.tms.coverTile(tile)) {
            const { tiles, fractionCovered } = this.makeTiles(child, intArea, minZ, coveringFraction);
            if (fractionCovered != 0) {
                ans.fractionCovered += fractionCovered * 0.25;
                addNonDupes(ans.tiles, tiles);
            }
        }

        if (
            // tile too small OR children have enough coverage
            (tile.z > minZ + 2 || ans.fractionCovered >= coveringFraction) &&
            // AND more than one child tile
            ans.tiles.length > 1 &&
            // AND tile not too big
            tile.z >= minZ
        ) {
            ans.tiles = [tile]; // replace children with parent
        }

        return ans;
    }

    /**
     * Find the polygon covering of source imagery and a (optional) clip cutline. Truncates the
     * cutline to match.

     * @param sourceMetadata
     */
    private findCovering(sourceMetadata: SourceMetadata): MultiPolygon {
        let srcArea: MultiPolygon = [];
        const { resZoom } = sourceMetadata;

        // merge imagery bounds
        for (const { geometry } of sourceMetadata.bounds.features) {
            if (geometry.type === 'Polygon') {
                // ensure source polys overlap by using their bounding box
                const poly = GeoJson.toPositionPolygon(
                    this.padBounds(this.sourceWsg84PolyToBounds(geometry.coordinates[0]), resZoom).toBbox(),
                ) as Polygon;
                if (srcArea.length == 0) {
                    srcArea.push(poly);
                } else {
                    srcArea = union(srcArea, poly) as MultiPolygon;
                }
            }
        }

        if (this.clipPoly.length != 0) {
            // clip the imagery bounds
            this.clipPoly = (intersection(srcArea, this.clipPoly) ?? []) as MultiPolygon;
            return this.clipPoly;
        }

        // no cutline return imagery bounds
        return srcArea;
    }

    /**
     * Pad the bounds to take in to consideration blending and 100 pixels of adjacent image data

     * @param bounds
     * @param resZoom the imagery resolution target zoom level
     */
    private padBounds(bounds: Bounds, resZoom: number): Bounds {
        const px = this.tms.pixelScale(resZoom);

        // Ensure cutline blend does not interferre with non-costal edges
        return bounds.scaleFromCenter((bounds.width + px * (PixelPadding + this.blend) * 2) / bounds.width);
    }
}

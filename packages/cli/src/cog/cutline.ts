import { Bounds, Epsg, GeoJson, Tile, TileMatrixSet } from '@basemaps/geo';
import { compareName, FileOperator, NamedBounds, ProjectionTileMatrixSet } from '@basemaps/shared';
import { FeatureCollection } from 'geojson';
import { CoveringFraction, MaxImagePixelWidth } from './constants';
import { CogJob, SourceMetadata } from './types';
import { clipMultipolygon, removeDegenerateEdges, polyContainsBounds } from './clipped.multipolygon';
import pc, { MultiPolygon, Ring, Polygon } from 'polygon-clipping';
const { intersection, union } = pc;

/** Padding to always apply to image boundies */
const PixelPadding = 100;

function findGeoJsonProjection(geojson: any | null): Epsg {
    return Epsg.parse(geojson?.crs?.properties?.name ?? '') ?? Epsg.Wgs84;
}

function namedBounds(tms: TileMatrixSet, tile: Tile): NamedBounds {
    return { name: TileMatrixSet.tileToName(tile), ...tms.tileToSourceBounds(tile).toJson() };
}

/**
 * Filter out duplicate tiles
 */
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
    private srcPoly: MultiPolygon = [];

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
    filterSourcesForName(name: string, job: CogJob): void {
        const tile = TileMatrixSet.nameToTile(name);
        const { targetProj } = this;
        const tileBounds = targetProj.tileToSourceBounds(tile);
        const tilePadded = this.padBounds(tileBounds, job.source.resZoom);

        let tileBoundsInSrcProj = tilePadded;

        if (job.source.projection !== this.tms.projection.code) {
            // convert the padded quadKey to source projection ensuring fully enclosed
            const sourceProj = ProjectionTileMatrixSet.get(job.source.projection);
            const poly = targetProj.projectMultipolygon([tileBoundsInSrcProj.toPolygon()], sourceProj);
            tileBoundsInSrcProj = Bounds.fromMultiPolygon(poly);
        }

        job.source.files = job.source.files.filter((image) => tileBoundsInSrcProj.intersects(Bounds.fromJson(image)));

        if (this.clipPoly.length > 0) {
            const poly = clipMultipolygon(this.clipPoly, tilePadded);
            if (poly.length == 0) {
                // this tile is not needed
                this.clipPoly = [];
                job.source.files = [];
            } else if (polyContainsBounds(poly, tileBounds)) {
                // tile is completely surrounded; no cutline polygons needed
                this.clipPoly = [];
            } else {
                // set the cutline polygons to just the area of interest (minus degenerate edges)
                this.clipPoly = removeDegenerateEdges(poly, tilePadded);
            }
        }
    }

    /**
     * Generate an optimized WebMercator tile cover for the supplied polygons
     * @param featureCollection Source TIff Polygons in GeoJson WGS84
     */
    optimizeCovering(sourceMetadata: SourceMetadata): NamedBounds[] {
        this.findCovering(sourceMetadata);

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
            tiles = tiles.concat(this.makeTiles(tile, this.srcPoly, minZ, CoveringFraction).tiles);
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
        const clipBounds = this.targetProj.tileToSourceBounds(tile);

        srcArea = clipMultipolygon(srcArea, clipBounds);

        if (srcArea.length == 0) {
            return { tiles: [], fractionCovered: 0 };
        }

        if (tile.z == minZ + 4) {
            return { tiles: [tile], fractionCovered: 1 };
        }

        const ans = { tiles: [] as Tile[], fractionCovered: 0 };

        for (const child of this.tms.coverTile(tile)) {
            const { tiles, fractionCovered } = this.makeTiles(child, srcArea, minZ, coveringFraction);
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
    private findCovering(sourceMetadata: SourceMetadata): void {
        let srcPoly: MultiPolygon = [];
        const { resZoom } = sourceMetadata;

        // merge imagery bounds
        for (const image of sourceMetadata.bounds) {
            const poly = Bounds.fromJson(image).toPolygon() as Polygon;
            srcPoly = union(srcPoly, poly);
        }

        // Convert polygon to target projection
        const sourceProj = ProjectionTileMatrixSet.get(sourceMetadata.projection);
        srcPoly = sourceProj.projectMultipolygon(srcPoly, this.targetProj) as MultiPolygon;
        this.srcPoly = srcPoly;

        if (this.clipPoly.length == 0) return;

        const srcBounds = Bounds.fromMultiPolygon(srcPoly);
        const boundsPadded = this.padBounds(srcBounds, resZoom);

        const poly = clipMultipolygon(this.clipPoly, boundsPadded);
        if (poly.length == 0) {
            throw new Error('No intersection between source imagery and cutline');
        }
        if (polyContainsBounds(poly, srcBounds)) {
            // tile is completely surrounded; no cutline polygons needed
            this.clipPoly = [];
        } else {
            // set the cutline polygons to just the area of interest (minus degenerate edges)
            this.clipPoly = removeDegenerateEdges(poly, boundsPadded);
            this.srcPoly = intersection(srcPoly, this.clipPoly) ?? [];
        }
    }

    /**
     * Pad the bounds to take in to consideration blending and 100 pixels of adjacent image data

     * @param bounds
     * @param resZoom the imagery resolution target zoom level
     */
    private padBounds(bounds: Bounds, resZoom: number): Bounds {
        const px = this.tms.pixelScale(resZoom);

        // Ensure cutline blend does not interferre with non-costal edges
        const widthScale = (bounds.width + px * (PixelPadding + this.blend) * 2) / bounds.width;
        const heightScale = (bounds.height + px * (PixelPadding + this.blend) * 2) / bounds.height;
        return bounds.scaleFromCenter(widthScale, heightScale);
    }
}

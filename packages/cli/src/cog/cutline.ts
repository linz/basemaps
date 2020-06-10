import { Epsg, GeoJson, QuadKey, Bounds, TileMatrixSetQuadKey, Tile } from '@basemaps/geo';
import { FileOperator, ProjectionTileMatrixSet } from '@basemaps/shared';
import { FeatureCollection, Position } from 'geojson';
import { basename } from 'path';
import { CoveringFraction, MaxImagePixelWidth } from './constants';
import { CogJob, SourceMetadata } from './types';
import { intersection, union, MultiPolygon, Polygon, Ring } from 'polygon-clipping';

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

export class Cutline {
    clipPoly: MultiPolygon = [];
    targetProj: ProjectionTileMatrixSet;
    tmsQk: TileMatrixSetQuadKey; // convenience link to targetProj.tms.quadKey
    blend: number;

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
        this.tmsQk = targetProj.tms.quadKey;
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
     * For the given QuadKey filter job.source.fles and cutline polygons that are within bounds plus
     * padding
     *
     * @param quadKey
     * @param job
     * @param  sourceGeo
     */
    filterSourcesForQuadKey(quadKey: string, job: CogJob, sourceGeo: FeatureCollection): void {
        const tile = this.tmsQk.toTile(quadKey);
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
                // this quadKey is not needed
                this.clipPoly = [];
                job.source.files = [];
            } else if (
                poly.length == 1 &&
                polysSameShape(poly[0], boundsPoly) &&
                this.sourcePolyToBounds(poly[0][0]).containsBounds(qkBounds)
            ) {
                // quadKey is completely surrounded; no cutline polygons needed
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
    optimizeCovering(sourceMetadata: SourceMetadata): string[] {
        const srcArea = this.findCovering(sourceMetadata);

        const { resZoom } = sourceMetadata;
        // Look for the biggest tile size we are allowed to create.
        let minZ = resZoom - 1;
        while (minZ > 1 && this.targetProj.getImagePixelWidth({ x: 0, y: 0, z: minZ }, resZoom) < MaxImagePixelWidth) {
            --minZ;
        }
        minZ = Math.max(1, minZ + 1);

        let quadKeys: string[] = [];

        for (const tile of this.tmsQk.coverTile()) {
            // Don't make COGs with a quadKey shorter than minZ.
            quadKeys = quadKeys.concat(this.makeQuadKeys(tile, srcArea, minZ, CoveringFraction).quadKeys);
        }

        if (quadKeys.length == 0) {
            throw new Error('Source imagery does not overlap with project extent');
        }
        if (quadKeys.length == 1 && quadKeys[0] == '') {
            // empty quakKey strings cause problems for filenames.
            quadKeys = Array.from(this.tmsQk.coverTile()).map((t) => this.tmsQk.fromTile(t));
        }
        return quadKeys.sort(QuadKey.compareKeys);
    }

    /**
     * Convert JobCutline to geojson FeatureCollection
     */
    toGeoJson(): FeatureCollection {
        const { toWsg84 } = this.targetProj;
        return GeoJson.toFeatureCollection([
            GeoJson.toFeatureMultiPolygon(this.clipPoly.map((p) => [p[0].map(toWsg84)])),
        ]);
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
     * @param minZ Only produce quadKeys for zoom levels at least `minZ` and no sibling tiles
     * greater than `minZ +2`
     * @param coveringFraction merge tiles that cover at least this fraction
     * @return the quadKeys and fraction covered of the tile by this srcArea
     */
    private makeQuadKeys(
        tile: Tile,
        srcArea: MultiPolygon,
        minZ: number,
        coveringFraction: number,
    ): { quadKeys: string[]; fractionCovered: number } {
        const clip = this.targetProj.tileToPolygon(tile) as Polygon;
        const intArea = intersection(srcArea, clip);

        if (intArea.length == 0) {
            return { quadKeys: [], fractionCovered: 0 };
        }
        if (tile.z == Math.min(minZ + 4, this.tmsQk.zMax - 1)) {
            return { quadKeys: [this.tmsQk.fromTile(tile)], fractionCovered: 1 };
        }

        const ans = { quadKeys: [] as string[], fractionCovered: 0 };

        for (const child of this.tmsQk.coverTile(tile)) {
            const { quadKeys, fractionCovered } = this.makeQuadKeys(child, intArea, minZ, coveringFraction);
            if (fractionCovered != 0) {
                ans.fractionCovered += fractionCovered * 0.25;
                ans.quadKeys = ans.quadKeys.concat(quadKeys);
            }
        }

        if (
            // tile too small OR children have enough coverage
            (tile.z > minZ + 2 || ans.fractionCovered >= coveringFraction) &&
            // AND more than one child quadkey
            ans.quadKeys.length > 1 &&
            // AND tile not too big
            tile.z >= minZ
        ) {
            ans.quadKeys = [this.tmsQk.fromTile(tile)]; // replace children with parent
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
        const px = this.targetProj.tms.pixelScale(resZoom);

        // Ensure cutline blend does not interferre with non-costal edges
        return bounds.scaleFromCenter((bounds.width + px * (PixelPadding + this.blend) * 2) / bounds.width);
    }
}

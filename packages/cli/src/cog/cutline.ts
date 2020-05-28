import { Bounds, Epsg, GeoJson, QuadKey, QuadKeyTrie } from '@basemaps/geo';
import { FileOperator } from '@basemaps/lambda-shared';
import bbox from '@turf/bbox';
import intersect from '@turf/intersect';
import { FeatureCollection, Position } from 'geojson';
import { basename } from 'path';
import { CoveringPercentage, CutlineZoom, ZoomDifferenceForMaxImage } from './constants';
import { TileGrid } from './tile.grid';
import { CogJob, SourceMetadata } from './types';

const PaddingFactor = 1.125;
const MinCoverSize = 5;

function findGeoJsonProjection(geojson: any | null): Epsg {
    return Epsg.parse(geojson?.crs?.properties?.name ?? '') ?? Epsg.Wgs84;
}

function mergeCovering(self: QuadKeyTrie, other: string[] | QuadKeyTrie): void {
    for (const qk of other) self.add(qk);
}

function getCoverZ(imageTargetZoom: number): number {
    return Math.max(1, imageTargetZoom - 2);
}

export class Cutline {
    polygons: Position[][] = [];
    extent: TileGrid;

    /**
     * Create a Cutline instanse from a GeoJSON FeatureCollection
     */
    constructor(targetProjection: Epsg, geojson?: FeatureCollection) {
        const extent = TileGrid.get(targetProjection.code);
        this.extent = extent;
        if (geojson == null) return;
        if (findGeoJsonProjection(geojson) !== Epsg.Wgs84) {
            throw new Error('Invalid geojson; CRS may not be set for cutline!');
        }
        for (const { geometry } of geojson.features) {
            if (geometry.type === 'MultiPolygon') {
                for (const [coords] of geometry.coordinates) {
                    this.polygons.push(coords);
                }
            } else if (geometry.type === 'Polygon') {
                this.polygons.push(geometry.coordinates[0]);
            }
        }
    }

    /**
     * Given a srcBounds and srcCovering filter out cutline polygons that do intersect and truncate
     * polygons which extrude from the srcCovering

     * @param srcBounds the extend of the source imagery
     * @param srcCovering detailed covering of the source imagery
     * @return A covering which is the intersection of the srcCovering and the cutline covering
     */
    filterCutline(srcBounds: Bounds, srcCovering: QuadKeyTrie): QuadKeyTrie {
        // We have a cutline. Filter it by sourceBounds and return intersection
        const keepLines: Position[][] = [];

        // The Trie covering the cutline(s)
        const clCovering = new QuadKeyTrie();

        const tg = this.extent.getLevel(CutlineZoom);

        // add a poly to the clCovering;
        const coverCutline = (poly: Position[]): void => {
            const pCovering = tg.coverPolygon(poly, 1);
            if (pCovering.intersectsTrie(srcCovering)) {
                mergeCovering(clCovering, pCovering);
                keepLines.push(poly);
            }
        };

        const srcBoundsPoly = GeoJson.toPolygon(
            GeoJson.toPositionPolygon(srcBounds.scaleFromCenter(PaddingFactor).toBbox()),
        );

        for (const srcPoly of this.polygons) {
            // reduce poly to source imagery bounds
            const p = intersect(srcBoundsPoly, GeoJson.toPolygon([srcPoly]))?.geometry;
            if (p == null) continue;
            if (p.type === 'Polygon') {
                const coords = p.coordinates[0];
                if (coords.length < 6 && Bounds.fromBbox(bbox(p)).containsBounds(srcBounds)) {
                    this.polygons = [];
                    return srcCovering;
                }
                coverCutline(p.coordinates[0]);
            } else {
                for (const coords of p.coordinates) {
                    coverCutline(coords[0]);
                }
            }
        }

        this.polygons = keepLines;
        return clCovering;
    }

    /**
     * Find the covering of source imagery and a (optional) cutline. Truncates the cutline to match.

     * @param sourceMetadata
     * @param coverZ zoom level to cover at
     * @return the covering at sourceZ resolution
     */
    findCovering(sourceMetadata: SourceMetadata): QuadKeyTrie {
        const coverZ = getCoverZ(sourceMetadata.resolution);

        const srcCovering = new QuadKeyTrie();

        let srcBounds: Bounds | null = null;

        const tg = this.extent.getLevel(coverZ);

        for (const { geometry } of sourceMetadata.bounds.features) {
            if (geometry.type === 'Polygon') {
                const cBounds = Bounds.fromBbox(bbox(geometry));
                if (srcBounds == null) {
                    srcBounds = cBounds;
                } else {
                    srcBounds = srcBounds.union(cBounds);
                }
                mergeCovering(srcCovering, tg.coverPolygon(geometry.coordinates[0], MinCoverSize));
            }
        }

        if (srcBounds == null || this.polygons.length == 0) return srcCovering;

        const clCovering = this.filterCutline(srcBounds, srcCovering);

        if (clCovering === srcCovering) return srcCovering;

        return srcCovering.intersection(clCovering);
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
        const qkBounds = QuadKey.toBounds(quadKey);
        const qkPadded = qkBounds.scaleFromCenter(PaddingFactor);

        const srcCovering = new QuadKeyTrie();

        const srcTiffs = new Set<string>();

        const coverZ = getCoverZ(job.source.resolution);

        const tg = this.extent.getLevel(coverZ);

        for (const f of sourceGeo.features) {
            const { geometry } = f;
            if (geometry.type === 'Polygon') {
                if (qkPadded.intersects(Bounds.fromBbox(bbox(geometry)))) {
                    srcTiffs.add(basename(f.properties!.tiff!));
                    mergeCovering(srcCovering, tg.coverPolygon(geometry.coordinates[0], MinCoverSize));
                }
            }
        }
        job.source.files = job.source.files.filter((path) => srcTiffs.has(basename(path)));

        if (this.polygons.length > 0) {
            const clCovering = this.filterCutline(qkBounds, srcCovering);

            if (clCovering !== srcCovering && this.polygons.length == 0) {
                job.source.files = [];
            }
        }
    }

    /**
     * Generate an optimized WebMercator tile cover for the supplied polygons
     * @param featureCollection Source TIff Polygons in GeoJson WGS84
     */
    optimizeCovering(sourceMetadata: SourceMetadata): string[] {
        const sourceZ = sourceMetadata.resolution;

        // Don't make COGs with a quadKey shorter than minZ.
        const minZ = Math.max(1, sourceZ + ZoomDifferenceForMaxImage);

        const covering = this.findCovering(sourceMetadata);

        covering.mergeQuadKeys(CoveringPercentage, minZ, minZ + 2);

        /** We should never return a full cover, using '' as a index causes problems */
        if (covering.has('')) return QuadKey.children('');

        return Array.from(covering);
    }

    /**
     * Convert JobCutline to geojson FeatureCollection
     */
    toGeoJson(): FeatureCollection {
        const coords: Position[][][] = [];
        for (const poly of this.polygons.values()) {
            coords.push([poly]);
        }

        return GeoJson.toFeatureCollection([GeoJson.toFeatureMultiPolygon(coords)]);
    }

    /**
     * Load a geojson cutline from the file-system and convert to one multi-polygon with any holes removed
     *
     * @param path the path of the cutline to load. Can be `s3://` or local file path.
     */
    static async loadCutline(targetProjection: Epsg, path?: string): Promise<Cutline> {
        if (path == null || path == '') return new Cutline(targetProjection);
        const geojson = (await FileOperator.create(path).readJson(path)) as FeatureCollection;
        return new Cutline(targetProjection, geojson);
    }
}

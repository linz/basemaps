import { Epsg, GeoJson, QuadKey, TileMatrixSet } from '@basemaps/geo';
import { FileOperator } from '@basemaps/shared';
import { FeatureCollection } from 'geojson';
import { intersection, MultiPolygon, union } from 'martinez-polygon-clipping';
import { basename } from 'path';
import { CoveringPercentage, ZoomDifferenceForMaxImage } from './constants';
import { TmsUtil } from './tms.util';
import { CogJob, SourceMetadata } from './types';

const PaddingFactor = 1.125;

function findGeoJsonProjection(geojson: any | null): Epsg {
    return Epsg.parse(geojson?.crs?.properties?.name ?? '') ?? Epsg.Wgs84;
}

function polysEqual(a: MultiPolygon, b: MultiPolygon): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) {
        if (a[i].length !== 1 || b[i].length !== 1) return false;
        const a1 = a[i][0];
        const b1 = b[i][0];
        for (let j = 0; j < a1.length; ++j) {
            if (a1[j][0] !== b1[j][0] || a1[j][1] !== b1[j][1]) return false;
        }
    }
    return true;
}

export class Cutline {
    polygons: MultiPolygon = [];
    targetTms: TileMatrixSet;

    /**
     * Create a Cutline instanse from a GeoJSON FeatureCollection
     */
    constructor(targetTms: TileMatrixSet, geojson?: FeatureCollection) {
        this.targetTms = targetTms;
        if (geojson == null) {
            return;
        }
        if (findGeoJsonProjection(geojson) !== Epsg.Wgs84) {
            throw new Error('Invalid geojson; CRS may not be set for cutline!');
        }
        const { inverse } = TmsUtil.getProjection(this.targetTms);
        for (const { geometry } of geojson.features) {
            if (geometry.type === 'MultiPolygon') {
                for (const coords of geometry.coordinates) {
                    this.polygons.push([coords[0].map(inverse)]);
                }
            } else if (geometry.type === 'Polygon') {
                this.polygons.push([geometry.coordinates[0].map(inverse)]);
            }
        }
    }

    /**
     * Load a geojson cutline from the file-system and convert to one multi-polygon with any holes removed
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
        const qkBounds = TmsUtil.tileToSourceBounds(this.targetTms, QuadKey.toTile(quadKey));
        const qkPadded = GeoJson.toPositionPolygon(qkBounds.scaleFromCenter(PaddingFactor).toBbox());

        let srcArea: MultiPolygon = [];

        const srcTiffs = new Set<string>();

        const { inverse } = TmsUtil.getProjection(this.targetTms);
        for (const f of sourceGeo.features) {
            const { geometry } = f;
            if (geometry.type === 'Polygon') {
                const poly = intersection([geometry.coordinates[0].map(inverse)], qkPadded) as MultiPolygon;
                if (poly != null && poly.length != 0) {
                    srcTiffs.add(basename(f.properties!.tiff!));
                    if (srcArea.length == 0) {
                        srcArea = poly;
                    } else {
                        srcArea = union(srcArea, poly) as MultiPolygon;
                    }
                }
            }
        }
        job.source.files = job.source.files.filter((path) => srcTiffs.has(basename(path)));

        if (this.polygons.length > 0) {
            const poly = intersection(srcArea, this.polygons) as MultiPolygon;
            if (poly == null || poly.length == 0) {
                this.polygons = [];
                job.source.files = [];
            } else {
                if (polysEqual(poly, srcArea)) {
                    this.polygons = [];
                } else {
                    this.polygons = poly;
                }
            }
        }
    }

    /**
     * Generate an optimized WebMercator tile cover for the supplied polygons
     * @param featureCollection Source TIff Polygons in GeoJson WGS84
     */
    optimizeCovering(sourceMetadata: SourceMetadata): string[] {
        const srcArea = this.findCovering(sourceMetadata.bounds, this.polygons);
        if (this.polygons.length !== 0) this.polygons = srcArea;

        const sourceZ = sourceMetadata.resolution;
        const minZ = Math.max(1, sourceZ + ZoomDifferenceForMaxImage);
        // Don't make COGs with a quadKey shorter than minZ.

        const { quadKeys } = this.makeQuadKeys('', srcArea, minZ, CoveringPercentage);
        return quadKeys.sort(QuadKey.compareKeys);
    }

    /**
     * Convert JobCutline to geojson FeatureCollection
     */
    toGeoJson(): FeatureCollection {
        const { forward } = TmsUtil.getProjection(this.targetTms);
        return GeoJson.toFeatureCollection([
            GeoJson.toFeatureMultiPolygon(this.polygons.map((p) => [p[0].map((q) => forward(q))])),
        ]);
    }

    /**
     * Merge child nodes that have at least a covering fraction
     * @param quadKey the quadKey to descend
     * @param srcArea the aread of interest
     * @param minZ Don't produce any quadKeys of this length or less and creater than this length + 2
     * @param coveringFraction merge tiles that cover at least this fraction
     * @return the quadKeys and percentage covered of the world by this srcArea set
     */
    private makeQuadKeys(
        quadKey: string,
        srcArea: MultiPolygon,
        minZ: number,
        coveringFraction: number,
    ): { quadKeys: string[]; fractionCovered: number } {
        const clip = TmsUtil.tileToPolygon(this.targetTms, QuadKey.toTile(quadKey));
        const intArea = intersection(srcArea, clip) as MultiPolygon | null;
        if (intArea == null || intArea.length == 0) return { quadKeys: [], fractionCovered: 0 };
        if (quadKey.length == minZ + 4) {
            return { quadKeys: [quadKey], fractionCovered: 1 };
        } else {
            const ans: { quadKeys: string[]; fractionCovered: number } = { quadKeys: [], fractionCovered: 0 };
            for (let i = 0; i < 4; ++i) {
                const { quadKeys, fractionCovered } = this.makeQuadKeys(
                    quadKey + i.toString(),
                    intArea,
                    minZ,
                    coveringFraction,
                );
                if (fractionCovered == 0) continue;
                ans.fractionCovered += fractionCovered * 0.25;
                ans.quadKeys = ans.quadKeys.concat(quadKeys);
            }
            if (
                (ans.fractionCovered >= coveringFraction || quadKey.length > minZ + 2) &&
                ans.quadKeys.length > 1 &&
                quadKey.length >= minZ
            )
                ans.quadKeys = [quadKey];

            return ans;
        }
    }

    /**
     * Find the polygon covering of source imagery and a (optional) cutline. Truncates the cutline to match.

     * @param sourceGeo
     */
    private findCovering(sourceGeo: FeatureCollection, clip: MultiPolygon): MultiPolygon {
        let srcArea: MultiPolygon = [];
        const { inverse } = TmsUtil.getProjection(this.targetTms);

        // merge imagery bounds
        for (const { geometry } of sourceGeo.features) {
            if (geometry.type === 'Polygon') {
                const poly = [geometry.coordinates[0].map(inverse)];
                if (srcArea.length == 0) {
                    srcArea.push(poly);
                } else {
                    srcArea = union(srcArea, poly) as MultiPolygon;
                }
            }
        }

        if (clip.length != 0) {
            // clip the imagery bounds
            return (intersection(srcArea, clip) ?? []) as MultiPolygon;
        }

        // no cutline return imagery bounds
        return srcArea;
    }
}

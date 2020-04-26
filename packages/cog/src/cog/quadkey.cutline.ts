import { Bounds, GeoJson } from '@basemaps/geo';
import { FileOperator } from '@basemaps/lambda-shared';
import bbox from '@turf/bbox';
import booleanDisjoint from '@turf/boolean-disjoint';
import booleanWithin from '@turf/boolean-within';
import intersect from '@turf/intersect';
import { Feature, FeatureCollection, Polygon, Position } from 'geojson';
import { basename } from 'path';
import { CogJob } from './types';

const QuadKeyPadding = 1.25;

function makePolygon(coordinates: Position[][]): Polygon {
    return {
        type: 'Polygon',
        coordinates,
    };
}

interface SourceMapAttrs {
    bounds: Bounds;
    poly: Feature<Polygon>;
}

function makeSourceMap(inp: FeatureCollection): Record<string, SourceMapAttrs> {
    const map: Record<string, SourceMapAttrs> = {};

    for (const poly of inp.features) {
        if (poly.geometry.type === 'Polygon') {
            map[basename(poly.properties?.tiff)] = {
                bounds: Bounds.fromBbox(bbox(poly.geometry)),
                poly: poly as Feature<Polygon>,
            };
        }
    }

    return map;
}

export class QuadKeyCutline {
    private polys: Position[][] = [];

    /**
     * Create a QuadKeyCutline instanse from a GeoJSON FeatureCollection
     */
    constructor(geojson?: FeatureCollection) {
        if (geojson == null) return;

        const { geometry } = geojson.features[0];

        if (geometry.type !== 'MultiPolygon') throw new Error('Cutline is not a JobCutline!');

        for (const [coords] of geometry.coordinates) {
            this.polys.push(coords);
        }
    }

    /**
     * For the given QuadKey filter job.source.fles and cutline polygons that are within bounds plus
     * padding
     *
     * @param quadKey
     * @param job
     * @param  sourceGeo

     * @returns the number of cropped Source files or -1 if Quadkey outside cutline
     */
    filterSources(quadKey: string, job: CogJob, sourceGeo: FeatureCollection): number {
        let cropCount = 0;
        const qkBounds = Bounds.fromQuadKey(quadKey);
        const padded = qkBounds.scaleFromCenter(QuadKeyPadding);

        const currPoly = makePolygon([[]]);
        const { coordinates } = currPoly;

        // filter cutline polygons
        let needCropping = true;
        let croppedPolys: Position[][] = [];

        const qkPoly = makePolygon(GeoJson.toPositionPolygon(qkBounds.toBbox()));
        const paddedPoly = makePolygon(GeoJson.toPositionPolygon(padded.toBbox()));

        for (const poly of this.polys.values()) {
            coordinates[0] = poly;
            if (booleanWithin(qkPoly, currPoly)) {
                croppedPolys = [];
                needCropping = false; // We are not cropped
                break;
            }

            const p = intersect(paddedPoly, currPoly)?.geometry;
            if (p != null) {
                if (p.type === 'Polygon') {
                    croppedPolys.push(p.coordinates[0]);
                } else {
                    for (const coords of p.coordinates) {
                        croppedPolys.push(coords[0]);
                    }
                }
            }
        }

        if (needCropping && croppedPolys.length == 0 && this.polys.length != 0) {
            // quadkey outside cutline
            job.source.files = [];
            this.polys = [];
            return -1;
        }

        const sourceMap = makeSourceMap(sourceGeo);

        const usePolys = new Set<Position[]>();

        // filter to source files near quadkey
        job.source.files = job.source.files.filter((path) => {
            const tiffName = basename(path);
            const tiffBounds = sourceMap[tiffName];

            if (tiffBounds == null) {
                throw new Error(`can't find ${tiffName} in source.geojson`);
            }

            if (!padded.intersects(tiffBounds.bounds)) return false; // image outside quadKey

            if (croppedPolys.length == 0) return true;

            const foundp: Position[][] = [];

            for (const poly of croppedPolys) {
                coordinates[0] = poly;
                if (booleanWithin(tiffBounds.poly, currPoly)) {
                    return true;
                }
                if (!booleanDisjoint(tiffBounds.poly, currPoly)) {
                    foundp.push(poly);
                }
            }

            if (foundp.length != 0) {
                ++cropCount;
                for (const p of foundp) usePolys.add(p);
                return true;
            }
            return false;
        });

        this.polys = Array.from(usePolys.values());

        return cropCount;
    }

    /**
     * Write a temporary cutline FeatureCollection to geojson file
     *
     * @param cutline defines the cutline
     * @param tmpFolder the directory write the cutline to
     * @return the path of the cutline file
     */
    async writeCutline(target: string): Promise<string> {
        await FileOperator.create(target).write(target, Buffer.from(JSON.stringify(this.toGeoJson())));

        return target;
    }

    get polyCount(): number {
        return this.polys.length;
    }

    /**
     * Convert JobCutline to geojson FeatureCollection
     */
    toGeoJson(): FeatureCollection {
        const coords: Position[][][] = [];
        for (const poly of this.polys.values()) {
            coords.push([poly]);
        }

        return GeoJson.toFeatureCollection([GeoJson.toFeatureMultiPolygon(coords)]);
    }

    /**
     * Load a JobCutline geoJson from the file-system
     *
     * @param path the path of the cutline to load. Can be `s3://` or local file path.
     */
    static async loadCutline(path: string): Promise<QuadKeyCutline> {
        const geojson = JSON.parse((await FileOperator.create(path).read(path)).toString()) as FeatureCollection;
        return new QuadKeyCutline(geojson);
    }
}

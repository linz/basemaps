import { Bounds, EPSG, GeoJson, Projection, QuadKeyTrie } from '@basemaps/geo';
import { FileOperator } from '@basemaps/lambda-shared';
import { Feature, FeatureCollection, Polygon, Position } from 'geojson';
import { TileCover } from './tile.cover';

function findGeoJsonProjection(geojson: any | null): EPSG {
    return Projection.parseEpsgString(geojson?.crs?.properties?.name ?? '') ?? EPSG.Wgs84;
}

function addPolygonToQuadKey(self: JobCutline, quadKey: string, coords: Position[]): void {
    let coordMap = self.quadKeyMap.get(quadKey);
    if (coordMap == null) {
        coordMap = new Map<Position[], number>();
        self.quadKeyMap.set(quadKey, coordMap!);
    }
    coordMap!.set(coords, -1);
}

export class JobCutline {
    trie = new QuadKeyTrie();
    quadKeyMap = new Map<string, Map<Position[], number>>();
    polygons = new Set<Position[]>();
    maxZoom: number;

    /**
     * Create a JobCutline instanse from a GeoJSON FeatureCollection
     */
    constructor(geojson?: FeatureCollection, maxZoom = 13) {
        this.maxZoom = maxZoom;
        if (geojson == null) return;
        if (findGeoJsonProjection(geojson) !== EPSG.Wgs84) {
            throw new Error('Invalid geojson; CRS may not be set for cutline!');
        }
        for (const { geometry } of geojson.features) {
            if (geometry.type === 'MultiPolygon') {
                for (const [coords] of geometry.coordinates) {
                    this.addPolygon(coords);
                }
            } else if (geometry.type === 'Polygon') {
                this.addPolygon(geometry.coordinates[0]);
            }
        }
    }

    addPolygon(coords: Position[]): void {
        const polygon = GeoJson.toFeaturePolygon([coords]) as Feature<Polygon>;
        this.polygons.add(coords);
        const covering = TileCover.cover(polygon.geometry, 1, this.maxZoom);
        for (const qkey of covering) {
            this.trie.add(qkey);
            addPolygonToQuadKey(this, qkey, coords);
        }
        let prevQuadKey;
        for (let i = 0; i < coords.length; ++i) {
            const point = coords[i];
            const quadKeys = this.trie.getPoint(point);
            for (const q of quadKeys) {
                if (q != prevQuadKey) {
                    prevQuadKey = q;
                    const cm = this.quadKeyMap.get(q)!;
                    if (cm.has(coords)) {
                        cm.set(coords, i);
                        for (const bounds = Bounds.fromQuadKey(q); i + 1 < coords.length; ++i) {
                            if (!bounds.containsPoint(coords[i + 1])) break;
                        }
                        break;
                    }
                }
            }
        }
    }

    /**
     * Write a temporary cutline FeatureCollection to geojson file
     *
     * @param cutline defines the cutline
     * @param tmpFolder the directory write the cutline to
     * @return the path of the cutline file
     */
    async writeCutline(target: string): Promise<string> {
        await FileOperator.create(target).writeJson(target, this.toGeoJson());

        return target;
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
    static async loadCutline(path: string, maxZoom: number): Promise<JobCutline> {
        const geojson = (await FileOperator.create(path).readJson(path)) as FeatureCollection;
        return new JobCutline(geojson, maxZoom);
    }
}

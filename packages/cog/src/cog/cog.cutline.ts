import { Bounds, EPSG, GeoJson, Projection } from '@basemaps/geo';
import { FileOperator, LogType, VNodeElement, VNodeParser } from '@basemaps/lambda-shared';
import bbox from '@turf/bbox';
import booleanDisjoint from '@turf/boolean-disjoint';
import booleanWithin from '@turf/boolean-within';
import intersect from '@turf/intersect';
import { Feature, FeatureCollection, Polygon, Position } from 'geojson';
import * as Mercator from 'global-mercator';
import { basename } from 'path';
import { quadKeyToBounds } from '../proj';
import { CogJob } from './cog';

function collectPolygons(features: Feature[] | null, bounds: Polygon): Polygon[] {
    if (features == null || features.length == 0) return [bounds];
    const ans: Polygon[] = [];

    const addPoly = (coords: Position[]): boolean => {
        const poly = GeoJson.toFeaturePolygon([coords]).geometry as Polygon;
        if (booleanWithin(bounds, poly)) return true; // cutline not needed
        const p = intersect(bounds, poly)?.geometry;
        if (p != null) {
            if (p.type === 'Polygon') {
                ans.push(p);
            } else {
                for (const coords of p.coordinates) {
                    ans.push(GeoJson.toFeaturePolygon([coords[0]]).geometry as Polygon);
                }
            }
        }
        return false;
    };

    for (const { geometry: g } of features) {
        switch (g.type) {
            case 'MultiPolygon':
                for (const coords of g.coordinates) {
                    // take first index to remove any holes
                    if (addPoly(coords[0])) return [bounds];
                }
                break;
            case 'Polygon':
                // take first index to remove any holes
                if (addPoly(g.coordinates[0])) return [bounds];
                break;
        }
    }

    return ans;
}

function findGeoJsonProjection(geojson: any | null): EPSG {
    return Projection.parseEpsgString(geojson?.crs?.properties?.name ?? '') ?? EPSG.Wgs84;
}

function makeCutline(polygons: Polygon[]): FeatureCollection {
    return {
        type: 'FeatureCollection',
        features: polygons.map((p) => ({ type: 'Feature', properties: {}, geometry: p })),
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
                bounds: Bounds.fromBbox(bbox(poly.geometry) as Mercator.BBox),
                poly: poly as Feature<Polygon>,
            };
        }
    }

    return map;
}

export const Cutline = {
    /**
     * Build a vrt file for a tiff set with some tiffs transformed with a cutline
     *
     * @param tmpFolder temporary `cutline.geojson` will be written here
     * @param job
     * @param sourceGeo a GeoJSON object which contains the boundaries for the source images
     * @param inputVrt the source vrt to filter
     * @param quadKey to reduce vrt and cutline
     * @param logger
     *
     * @return the vrt object
     */
    async buildVrt(
        tmpFolder: string,
        job: CogJob,
        sourceGeo: FeatureCollection,
        inputVrt: Buffer | string | VNodeElement,
        quadKey: string,
        logger: LogType,
    ): Promise<VNodeElement> {
        logger.info({ quadKey }, 'buildCutlineVrt');

        const vrt = inputVrt instanceof VNodeElement ? inputVrt : await VNodeParser.parse(inputVrt.toString());

        const cutlinePath = job.output.cutline;
        const cutlineData = cutlinePath ? (await FileOperator.create(cutlinePath).read(cutlinePath)).toString() : '';
        let cutline: FeatureCollection | null =
            cutlineData == '' ? null : (JSON.parse(cutlineData) as FeatureCollection);
        if (findGeoJsonProjection(cutline) !== EPSG.Wgs84) {
            throw new Error('Invalid geojson; CRS may not be set! ' + cutlinePath);
        }
        const sourceMap = makeSourceMap(sourceGeo);

        const imgBounds = quadKeyToBounds(quadKey);
        const imgPoly: Polygon = {
            type: 'Polygon',
            coordinates: GeoJson.toPositionPolygon(imgBounds.scaleFromCenter(1.2).toBbox()),
        };
        const polygons = collectPolygons(cutline && cutline.features, imgPoly);

        if (polygons.length == 1 && polygons[0] === imgPoly) {
            cutline = null; // no need to cut images for this quadKey
        }

        const useTifs = new Set<string>();
        const usePolys = new Set<Polygon>();

        let inputTotal = 0,
            cropped = 0;

        for (const path of job.source.files) {
            ++inputTotal;
            const tiffName = basename(path);
            const tiffBounds = sourceMap[tiffName];

            if (tiffBounds == null) {
                throw new Error(`can't find ${tiffName} in source.geojson`);
            }

            if (!imgBounds.intersects(tiffBounds.bounds)) continue; // image outside quadKey

            if (cutline == null) {
                useTifs.add(tiffName);
                continue;
            }

            const foundp: Polygon[] = [];

            for (const p of polygons) {
                if (booleanWithin(tiffBounds.poly, p)) {
                    useTifs.add(tiffName);
                    foundp.length = 0;
                    break;
                }
                if (!booleanDisjoint(tiffBounds.poly, p)) {
                    foundp.push(p);
                }
            }

            if (foundp.length != 0) {
                ++cropped;
                useTifs.add(tiffName);
                for (const p of foundp) usePolys.add(p);
            }
        }

        job.source.files = Array.from(useTifs.values()).map((n) => FileOperator.join(job.source.path, n));

        if (usePolys.size == 0) {
            job.output.cutline = undefined;
        } else {
            job.output.cutline = await Cutline.writeCutline(makeCutline(Array.from(usePolys.values())), tmpFolder);
        }

        for (const b of vrt.tags('VRTRasterBand')) {
            const children: VNodeElement[] = [];
            for (const elm of b.elementChildren()) {
                if (elm.tag === 'SimpleSource' || elm.tag === 'ComplexSource') {
                    const sf = elm.tags('SourceFilename').next().value!;
                    const name = basename(sf.textContent);
                    if (!useTifs.has(name)) continue;
                }
                children.push(elm);
            }
            b.children = children;
        }

        logger.info(
            { inputTotal, outputTotal: useTifs.size + cropped, cropped, polygons: usePolys.size },
            'Tiff count',
        );

        return vrt;
    },

    /**
     * Write a temporary cutline FeatureCollection to geojson file
     *
     * @param cutline defines the cutline
     * @param tmpFolder the directory write the cutline to
     * @return the path of the cutline file
     */
    async writeCutline(cutline: FeatureCollection, tmpFolder: string): Promise<string> {
        const target = FileOperator.join(tmpFolder, 'cutline.geojson');

        await FileOperator.create(target).write(target, Buffer.from(JSON.stringify(cutline)));

        return target;
    },
};

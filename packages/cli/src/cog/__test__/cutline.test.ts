import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { MultiPolygon } from 'geojson';
import * as o from 'ospec';
import { Cutline } from '../cutline';
import { TmsUtil } from '../tms.util';
import { SourceMetadata } from '../types';
import { SourceTiffTestHelper } from './source.tiff.testhelper';
import { GeoJson, QuadKey } from '@basemaps/geo';
import { writeFileSync } from 'fs';
import { Approx } from '@basemaps/test';

const DebugPolys = false;

/** Write to ~/tmp for debugging in qgis */
function writeDebugPolys(poly: number[][][][]): void {
    if (!DebugPolys) return;
    writeFileSync(`${process.env.HOME}/tmp/poly.geojson`, JSON.stringify(GeoJson.toFeatureMultiPolygon(poly)));
}

o.spec('covering', () => {
    const testDir = `${__dirname}/../../../__test.assets__`;
    o('loadCutline', async () => {
        const cutline = new Cutline(GoogleTms, await Cutline.loadCutline(testDir + '/mana.geojson'));
        const geojson = cutline.toGeoJson();
        const mp = geojson.features[0].geometry as MultiPolygon;
        const { coordinates } = mp;
        mp.coordinates = [];
        o(geojson).deepEquals({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [],
                    },
                    properties: {},
                },
            ],
        });
        o(coordinates.length).equals(2);
        const [lon, lat] = coordinates[0][0][0];
        Approx.latLon({ lon, lat }, { lon: 174.781349356, lat: -41.077634319 });
    });

    o('findCovering', async () => {
        const cutline = new Cutline(GoogleTms, await Cutline.loadCutline(testDir + '/mana.geojson'));
        const feature = SourceTiffTestHelper.makeTiffFeatureCollection();

        o(cutline.polygons.length).equals(2);

        const result = (cutline as any).findCovering(feature, cutline.polygons);

        o(result.length).equals(1);

        writeDebugPolys(result);
    });

    o.spec('optmize', async () => {
        const geoJson = SourceTiffTestHelper.makeTiffFeatureCollection();

        o('low res', () => {
            const cutline = new Cutline(GoogleTms);

            const covering = cutline.optimizeCovering({ bounds: geoJson, resolution: 13 } as SourceMetadata);

            o(covering.length).equals(Array.from(covering).length);
            o(Array.from(covering)).deepEquals(['31133322', '31311100']);
        });

        o('hi res', () => {
            const covering2 = new Cutline(GoogleTms).optimizeCovering({
                bounds: geoJson,
                resolution: 18,
            } as SourceMetadata);

            o(covering2.length).equals(Array.from(covering2).length);

            o(Array.from(covering2)).deepEquals(
                [
                    '3113332222',
                    '3113332223',
                    '311333223202',
                    '31133322322',
                    '3131110000',
                    '3131110001',
                    '31311100100',
                    '313111001020',
                ].sort(QuadKey.compareKeys),
            );
        });
    });

    o('optimize should not cover the world', () => {
        const bounds = TmsUtil.toGeoJson(GoogleTms, ['']);
        const cutline = new Cutline(GoogleTms);
        const covering = cutline.optimizeCovering({ bounds, resolution: 0 } as SourceMetadata);
        o(Array.from(covering)).deepEquals(['0', '1', '2', '3']);
    });
});

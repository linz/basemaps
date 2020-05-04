import { MultiPolygon } from 'geojson';
import * as o from 'ospec';
import { Cutline } from '../cutline';
import { SourceMetadata } from '../types';
import { SourceTiffTestHelper } from './source.tiff.testhelper';

o.spec('covering', () => {
    const testDir = `${__dirname}/../../../__test.assets__`;
    o('loadCutline', async () => {
        const cutline = await Cutline.loadCutline(testDir + '/mana.geojson');
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
        o(coordinates[0][0][0]).deepEquals([174.78134935600005, -41.077634319065346]);
    });

    o('filterPolygons', async () => {
        const cutline = await Cutline.loadCutline(testDir + '/mana.geojson');

        const features = SourceTiffTestHelper.makeTiffFeatureCollection();

        o(cutline.polygons.length).equals(2);

        cutline.findCovering({ bounds: features, resolution: 18 } as SourceMetadata);

        o(cutline.polygons.length).equals(1);
    });

    o('optmize', async () => {
        const geoJson = SourceTiffTestHelper.makeTiffFeatureCollection();

        const cutline = new Cutline();

        const covering = cutline.optimizeCovering({ bounds: geoJson, resolution: 13 } as SourceMetadata);

        o(covering.size).equals(Array.from(covering).length);
        o(Array.from(covering)).deepEquals(['31133322', '31311100']);

        const covering2 = cutline.optimizeCovering({ bounds: geoJson, resolution: 19 } as SourceMetadata);

        o(covering2.size).equals(Array.from(covering2).length);

        o(Array.from(covering2)).deepEquals([
            '31133322221',
            '31133322223',
            '31133322230',
            '31133322231',
            '31133322232',
            '31133322233',
            '311333223202',
            '31133322322',
            '31311100001',
            '31311100003',
            '31311100010',
            '31311100011',
            '31311100012',
            '31311100013',
            '31311100100',
            '313111001020',
        ]);
    });
});

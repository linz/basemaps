import { FileOperatorSimple } from '@basemaps/lambda-shared';
import { MultiPolygon } from 'geojson';
import { JobCutline } from '../job.cutline';
import * as o from 'ospec';
import { GeoJson } from '@basemaps/geo';

const coords = [
    [174, -40],
    [175, -41],
    [175, -40],
    [174, -40],
];

o.spec('job.cutline', () => {
    const testDir = `${process.cwd()}/__test.assets__`;
    o('loadCutline', async () => {
        const cutline = await JobCutline.loadCutline(testDir + '/mana.geojson', 13);
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

    o.spec('writeCutline', () => {
        const origWrite = FileOperatorSimple.write;
        o.afterEach(() => {
            FileOperatorSimple.write = origWrite;
        });
        o('writeCutline', async () => {
            const cutline = new JobCutline(GeoJson.toFeatureCollection([GeoJson.toFeaturePolygon([coords])]));
            const write = o.spy();
            FileOperatorSimple.write = write as any;
            const tmpFolder = '/tmp/basemaps-123';
            const cutPath = await cutline.writeCutline(tmpFolder + '/cutline.geojson');
            const expPath = '/tmp/basemaps-123/cutline.geojson';
            o(cutPath).equals(expPath);
            o(write.args).deepEquals([expPath, Buffer.from(JSON.stringify(cutline.toGeoJson(), null, 2))]);
        });
    });
});

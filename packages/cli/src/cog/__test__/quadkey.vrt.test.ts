import { EpsgCode } from '@basemaps/geo';
import { FileOperatorSimple, LogConfig, ProjectionTileMatrixSet } from '@basemaps/shared';
import { round } from '@basemaps/test/build/rounding';
import { FeatureCollection } from 'geojson';
import * as o from 'ospec';
import { GdalCogBuilder } from '../../gdal/gdal';
import { Cutline } from '../cutline';
import { QuadKeyVrt } from '../quadkey.vrt';
import { SourceTiffTestHelper } from './source.tiff.testhelper';

o.spec('quadkey.vrt', () => {
    const tmpFolder = '/tmp/my-tmp-folder';

    const job = SourceTiffTestHelper.makeCogJob();

    const logger = LogConfig.get();
    LogConfig.disable();

    const testDir = `${__dirname}/../../../__test.assets__`;

    const googleProj = ProjectionTileMatrixSet.get(EpsgCode.Google);

    const [tif1Path, tif2Path] = [1, 2].map((i) => `${testDir}/tif${i}.tiff`);

    const [tif1Poly, tif2Poly] = SourceTiffTestHelper.tiffPolygons();

    const sourceGeo = {
        type: 'FeatureCollection',
        features: [],
    } as FeatureCollection;

    let cutTiffArgs: Array<Array<any>> = [];

    let runSpy = o.spy();

    const origFileOperatorWriteJson = FileOperatorSimple.writeJson;
    const { getGdal } = GdalCogBuilder;

    let gdal: any;

    o.after(() => {
        FileOperatorSimple.writeJson = origFileOperatorWriteJson;
        GdalCogBuilder.getGdal = getGdal;
    });

    o.beforeEach(() => {
        runSpy = o.spy();
        job.projection = job.source.projection = EpsgCode.Google;
        job.source.resZoom = 13;
        job.source.files = [tif1Path, tif2Path];
        gdal = { run: runSpy };
        (GdalCogBuilder as any).getGdal = (): any => gdal;
        sourceGeo.features = SourceTiffTestHelper.makeTiffFeatureCollection(
            [tif1Poly, tif2Poly],
            [tif1Path, tif2Path],
        ).features;

        cutTiffArgs = [];
        FileOperatorSimple.writeJson = ((...args: any): any => {
            cutTiffArgs.push(args);
        }) as any;

        job.output.cutline = undefined;
    });

    o('1 crosses, 1 outside', async () => {
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'));
        const cl2 = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/mana.geojson'));
        cutline.polygons.push(...cl2.polygons);

        job.source.resZoom = 17;

        const vrt = await QuadKeyVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, '31133322', logger);

        o(job.source.files).deepEquals([tif1Path, tif2Path]);
        o(cutline.polygons.length).equals(2);
        o(vrt).equals('/tmp/my-tmp-folder/quadkey.vrt');
    });

    o('not within quadKey', async () => {
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'));

        const vrt = await QuadKeyVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, '3131110001', logger);

        o(cutTiffArgs.length).equals(0);
        o(vrt).equals(null);
        o(runSpy.callCount).equals(0);
    });

    o('no cutline same projection', async () => {
        const vrt = await QuadKeyVrt.buildVrt(tmpFolder, job, sourceGeo, new Cutline(googleProj), '31', logger);

        o(job.source.files).deepEquals([tif1Path, tif2Path]);
        o(cutTiffArgs.length).equals(0);
        o(vrt).equals('/tmp/my-tmp-folder/source.vrt');
        o(runSpy.callCount).equals(1);
        o(runSpy.args[0]).equals('gdalbuildvrt');
    });

    o('no cutline diff projection', async () => {
        job.projection = EpsgCode.Nztm2000;
        const vrt = await QuadKeyVrt.buildVrt(tmpFolder, job, sourceGeo, new Cutline(googleProj), '31', logger);

        o(job.source.files).deepEquals([tif1Path, tif2Path]);
        o(cutTiffArgs.length).equals(0);
        o(vrt).equals('/tmp/my-tmp-folder/quadkey.vrt');
        o(runSpy.callCount).equals(2);
        o(runSpy.args[0]).equals('gdalwarp');
    });

    o('fully within same projection', async () => {
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'));

        const qkey = '31133322232111330';

        const vrt = await QuadKeyVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, qkey, logger);

        o(vrt).equals('/tmp/my-tmp-folder/source.vrt');
        o(job.source.files).deepEquals([tif2Path]);
        o(cutTiffArgs.length).equals(0);
        o(runSpy.callCount).equals(1);
        o(runSpy.args[0]).equals('gdalbuildvrt');
    });

    o('intersected cutline', async () => {
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'));
        job.output.cutline = { blend: 20, source: 'cutline.json' };

        const qkey = '311333222321113';

        const vrt = await QuadKeyVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, qkey, logger);

        o(vrt).equals('/tmp/my-tmp-folder/quadkey.vrt');
        o(job.source.files).deepEquals([tif2Path]);
        o(cutTiffArgs.length).equals(1);
        o(cutTiffArgs[0][1]).deepEquals(cutline.toGeoJson());

        o(round(cutTiffArgs[0], 6)).deepEquals([
            '/tmp/my-tmp-folder/cutline.geojson',
            {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [
                                [
                                    [
                                        [174.887066, -40.866925],
                                        [174.906635, -40.866925],
                                        [174.906635, -40.852124],
                                        [174.900083, -40.852124],
                                        [174.891215, -40.858532],
                                        [174.887066, -40.862718],
                                        [174.887066, -40.866925],
                                    ],
                                ],
                            ],
                        },
                        properties: {},
                    },
                ],
            },
        ]);
    });

    o('1 surrounded with s3 files', async () => {
        const mount = o.spy();
        gdal.mount = mount;

        const s3tif1 = 's3:/' + tif1Path;
        const s3tif2 = 's3:/' + tif2Path;
        const vtif1 = '/vsis3' + tif1Path;
        const vtif2 = '/vsis3' + tif2Path;

        job.source.files = [s3tif1, s3tif2];
        job.output.cutline = { blend: 10, source: 'cutline.json' };
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/mana.geojson'));

        const vrt = await QuadKeyVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, '3131110001', logger);

        o(vrt).equals('/tmp/my-tmp-folder/quadkey.vrt');
        o(cutTiffArgs.length).equals(1);
        o(cutTiffArgs[0][0]).equals(tmpFolder + '/cutline.geojson');

        o(cutline.polygons.length).equals(1);

        const geo = cutline.toGeoJson();

        o(geo.type).equals('FeatureCollection');

        const coordinates = (geo.features[0].geometry as any).coordinates;
        if (geo.type === 'FeatureCollection') {
            o(geo.features).deepEquals([
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates,
                    },
                },
            ]);
        }

        o(round(coordinates, 5)).deepEquals([
            [
                [
                    [174.77125, -41.09044],
                    [174.77212, -41.09741],
                    [174.78832, -41.08499],
                    [174.78135, -41.07763],
                    [174.78125, -41.07761],
                    [174.78117, -41.07752],
                    [174.78108, -41.07748],
                    [174.78099, -41.07749],
                    [174.78093, -41.07752],
                    [174.7809, -41.07756],
                    [174.78091, -41.07759],
                    [174.78097, -41.07765],
                    [174.78097, -41.07771],
                    [174.78084, -41.07778],
                    [174.78069, -41.07779],
                    [174.7801, -41.07774],
                    [174.77915, -41.08119],
                    [174.77125, -41.09044],
                ],
            ],
        ]);

        o(runSpy.callCount).equals(2);
        o(mount.calls.map((c: any) => c.args[0])).deepEquals([tmpFolder, s3tif1, s3tif2]);

        o((runSpy.calls[0] as any).args).deepEquals([
            'gdalbuildvrt',
            ['-hidenodata', '-addalpha', '/tmp/my-tmp-folder/source.vrt', vtif1, vtif2],
            logger,
        ]);

        o(runSpy.args).deepEquals([
            'gdalwarp',
            [
                '-of',
                'VRT',
                '-multi',
                '-wo',
                'NUM_THREADS=ALL_CPUS',
                '-s_srs',
                'EPSG:3857',
                '-t_srs',
                'EPSG:3857',
                '-cutline',
                '/tmp/my-tmp-folder/cutline.geojson',
                '-cblend',
                '10',
                '/tmp/my-tmp-folder/source.vrt',
                '/tmp/my-tmp-folder/quadkey.vrt',
            ],
            logger,
        ]);

        o(job.source.files).deepEquals([s3tif1, s3tif2]);
    });
});

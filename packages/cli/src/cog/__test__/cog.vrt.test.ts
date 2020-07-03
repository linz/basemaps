import { EpsgCode } from '@basemaps/geo';
import { FileOperatorSimple, LogConfig, ProjectionTileMatrixSet } from '@basemaps/shared';
import { qkToName } from '@basemaps/shared/build/tms/__test__/test.util';
import { round } from '@basemaps/test/build/rounding';
import o from 'ospec';
import { GdalCogBuilder } from '../../gdal/gdal';
import { CogVrt } from '../cog.vrt';
import { Cutline } from '../cutline';
import { SourceTiffTestHelper } from './source.tiff.testhelper';

o.spec('cog.vrt', () => {
    const tmpFolder = '/tmp/my-tmp-folder';

    const job = SourceTiffTestHelper.makeCogJob();

    const logger = LogConfig.get();
    LogConfig.disable();

    const testDir = `${__dirname}/../../../__test.assets__`;

    const googleProj = ProjectionTileMatrixSet.get(EpsgCode.Google);

    const sourceBounds = SourceTiffTestHelper.tiffNztmBounds(testDir);
    const [tif1, tif2] = sourceBounds;
    const [tif1Path, tif2Path] = sourceBounds.map(({ name }) => name);

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
        job.projection = EpsgCode.Google;
        job.source.projection = EpsgCode.Nztm2000;
        job.source.resZoom = 13;
        gdal = { run: runSpy };
        (GdalCogBuilder as any).getGdal = (): any => gdal;
        job.source.files = [tif1, tif2];

        cutTiffArgs = [];
        FileOperatorSimple.writeJson = ((...args: any): any => {
            cutTiffArgs.push(args);
        }) as any;

        job.output.cutline = undefined;
    });

    o('1 crosses, 1 outside', async () => {
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'));
        const cl2 = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/mana.geojson'));
        cutline.clipPoly.push(...cl2.clipPoly);

        job.source.resZoom = 17;

        const vrt = await CogVrt.buildVrt(tmpFolder, job, cutline, qkToName('31133322'), logger);

        o(job.source.files).deepEquals([tif1, tif2]);
        o(cutline.clipPoly.length).equals(2);
        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
    });

    o('not within tile', async () => {
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'));

        const vrt = await CogVrt.buildVrt(tmpFolder, job, cutline, qkToName('3131110001'), logger);

        o(cutTiffArgs.length).equals(0);
        o(vrt).equals(null);
        o(runSpy.callCount).equals(0);
    });

    o('no cutline same projection', async () => {
        const vrt = await CogVrt.buildVrt(tmpFolder, job, new Cutline(googleProj), qkToName('31'), logger);

        o(job.source.files).deepEquals([tif1, tif2]);
        o(cutTiffArgs.length).equals(0);
        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
        o(runSpy.callCount).equals(2);
        o(runSpy.args[0]).equals('gdalwarp');
    });

    o('no cutline diff projection', async () => {
        job.projection = EpsgCode.Nztm2000;
        const vrt = await CogVrt.buildVrt(tmpFolder, job, new Cutline(googleProj), qkToName('31'), logger);

        o(job.source.files).deepEquals([tif1, tif2]);
        o(cutTiffArgs.length).equals(0);
        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
        o(runSpy.callCount).equals(2);
        o(runSpy.args[0]).equals('gdalwarp');
    });

    o('fully within same projection', async () => {
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'), -100);

        const name = qkToName('311333222321113310');

        const vrt = await CogVrt.buildVrt(tmpFolder, job, cutline, name, logger);

        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
        o(job.source.files).deepEquals([tif2]);
        o(cutTiffArgs.length).equals(0);
        o(runSpy.callCount).equals(2);
        o(runSpy.args[0]).equals('gdalwarp');
    });

    o('intersected cutline', async () => {
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'), 20);
        job.output.cutline = { blend: 20, source: 'cutline.json' };

        const name = qkToName('311333222321113');

        const vrt = await CogVrt.buildVrt(tmpFolder, job, cutline, name, logger);

        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
        o(job.source.files).deepEquals([tif2]);
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
                                        [174.872663, -40.879256],
                                        [174.902917, -40.879256],
                                        [174.903924, -40.878474],
                                        [174.909682, -40.871987],
                                        [174.919346, -40.866023],
                                        [174.922943, -40.861803],
                                        [174.922943, -40.839788],
                                        [174.913543, -40.839788],
                                        [174.910775, -40.844398],
                                        [174.891215, -40.858532],
                                        [174.879634, -40.870215],
                                        [174.872663, -40.879256],
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

        job.source.files = job.source.files.map((o) => {
            o = Object.assign({}, o);
            o.name = 's3:/' + o.name;
            return o;
        });
        job.output.cutline = { blend: 10, source: 'cutline.json' };
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/mana.geojson'));

        const vrt = await CogVrt.buildVrt(tmpFolder, job, cutline, qkToName('3131110001'), logger);

        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
        o(cutTiffArgs.length).equals(1);
        o(cutTiffArgs[0][0]).equals(tmpFolder + '/cutline.geojson');

        o(cutline.clipPoly.length).equals(1);

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

        o(round((runSpy.calls[0] as any).args)).deepEquals([
            'gdalbuildvrt',
            [
                '-hidenodata',
                '-allow_projection_difference',
                '-tr',
                '19.10925707',
                '19.10925707',
                '-tap',
                '-addalpha',
                '/tmp/my-tmp-folder/source.vrt',
                vtif1,
                vtif2,
            ],
            logger,
        ]);

        o(round(runSpy.args)).deepEquals([
            'gdalwarp',
            [
                '-of',
                'VRT',
                '-multi',
                '-wo',
                'NUM_THREADS=ALL_CPUS',
                '-s_srs',
                'EPSG:2193',
                '-t_srs',
                'EPSG:3857',
                '-tr',
                '19.10925707',
                '19.10925707',
                '-tap',
                '-cutline',
                '/tmp/my-tmp-folder/cutline.geojson',
                '-cblend',
                '10',
                '/tmp/my-tmp-folder/source.vrt',
                '/tmp/my-tmp-folder/cog.vrt',
            ],
            logger,
        ]);
    });
});

import { EpsgCode } from '@basemaps/geo';
import { FileOperatorSimple, LogConfig, ProjectionTileMatrixSet } from '@basemaps/shared';
import { round } from '@basemaps/test/build/rounding';
import { FeatureCollection } from 'geojson';
import o from 'ospec';
import { GdalCogBuilder } from '../../gdal/gdal';
import { Cutline } from '../cutline';
import { CogVrt } from '../cog.vrt';
import { SourceTiffTestHelper } from './source.tiff.testhelper';
import { qkToName } from '@basemaps/shared/build/tms/__test__/test.util';

o.spec('cog.vrt', () => {
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
        cutline.clipPoly.push(...cl2.clipPoly);

        job.source.resZoom = 17;

        const vrt = await CogVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, qkToName('31133322'), logger);

        o(job.source.files).deepEquals([tif1Path, tif2Path]);
        o(cutline.clipPoly.length).equals(3);
        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
    });

    o('not within tile', async () => {
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'));

        const vrt = await CogVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, qkToName('3131110001'), logger);

        o(cutTiffArgs.length).equals(0);
        o(vrt).equals(null);
        o(runSpy.callCount).equals(0);
    });

    o('no cutline same projection', async () => {
        const vrt = await CogVrt.buildVrt(tmpFolder, job, sourceGeo, new Cutline(googleProj), qkToName('31'), logger);

        o(job.source.files).deepEquals([tif1Path, tif2Path]);
        o(cutTiffArgs.length).equals(0);
        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
        o(runSpy.callCount).equals(2);
        o(runSpy.args[0]).equals('gdalwarp');
    });

    o('no cutline diff projection', async () => {
        job.projection = EpsgCode.Nztm2000;
        const vrt = await CogVrt.buildVrt(tmpFolder, job, sourceGeo, new Cutline(googleProj), qkToName('31'), logger);

        o(job.source.files).deepEquals([tif1Path, tif2Path]);
        o(cutTiffArgs.length).equals(0);
        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
        o(runSpy.callCount).equals(2);
        o(runSpy.args[0]).equals('gdalwarp');
    });

    o('fully within same projection', async () => {
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'), -100);

        const name = qkToName('311333222321113310');

        const vrt = await CogVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, name, logger);

        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
        o(job.source.files).deepEquals([tif2Path]);
        o(cutTiffArgs.length).equals(0);
        o(runSpy.callCount).equals(2);
        o(runSpy.args[0]).equals('gdalwarp');
    });

    o('intersected cutline', async () => {
        const cutline = new Cutline(googleProj, await Cutline.loadCutline(testDir + '/kapiti.geojson'), 20);

        const poly = round(cutline.toGeoJson(), 6);

        job.output.cutline = { blend: 20, source: 'cutline.json' };

        const name = qkToName('311333222321113');

        const vrt = await CogVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, name, logger);

        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
        o(job.source.files).deepEquals([tif2Path]);
        o(cutTiffArgs.length).equals(1);
        o(cutTiffArgs[0][1]).deepEquals(cutline.toGeoJson());

        o(round(cutTiffArgs[0], 6)).deepEquals(['/tmp/my-tmp-folder/cutline.geojson', poly]);
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

        const vrt = await CogVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, qkToName('3131110001'), logger);

        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
        o(cutTiffArgs.length).equals(1);
        o(cutTiffArgs[0][0]).equals(tmpFolder + '/cutline.geojson');

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
                'EPSG:3857',
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

        o(job.source.files).deepEquals([s3tif1, s3tif2]);
    });
});

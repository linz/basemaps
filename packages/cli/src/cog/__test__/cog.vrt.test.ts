import path from 'path';
import url from 'url';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
import { EpsgCode, GoogleTms, Nztm2000Tms } from '@basemaps/geo';
import { fsa, LogConfig } from '@basemaps/shared';
import { qkToName } from '@basemaps/shared/build/proj/__test__/test.util.js';
import { round } from '@basemaps/test/build/rounding.js';
import o from 'ospec';
import { Gdal } from '../../gdal/gdal.js';
import { CogVrt } from '../cog.vrt.js';
import { Cutline } from '../cutline.js';
import { SourceTiffTestHelper } from './source.tiff.testhelper.js';

o.spec('cog.vrt', () => {
    const tmpFolder = '/tmp/my-tmp-folder';

    const job = SourceTiffTestHelper.makeCogJob();

    const logger = LogConfig.get();
    LogConfig.disable();

    const testDir = `${__dirname}/../../../__test.assets__`;

    const sourceBounds = SourceTiffTestHelper.tiffNztmBounds(testDir);
    const [tif1, tif2] = sourceBounds;
    const [tif1Path, tif2Path] = sourceBounds.map(({ name }) => name);

    let cutTiffArgs: Array<Array<any>> = [];

    let runSpy = o.spy();

    const origFileOperatorWriteJson = fsa.writeJson;
    const { create } = Gdal;

    let gdal: any;

    o.after(() => {
        fsa.writeJson = origFileOperatorWriteJson;
        Gdal.create = create;
    });

    o.beforeEach(() => {
        runSpy = o.spy();
        job.output.tileMatrix = GoogleTms.identifier;
        job.source.epsg = EpsgCode.Nztm2000;
        job.source.gsd = 20;
        gdal = { run: runSpy };
        (Gdal as any).create = (): any => gdal;
        job.source.files = [tif1, tif2];

        cutTiffArgs = [];
        fsa.writeJson = ((...args: any): any => {
            cutTiffArgs.push(args);
        }) as any;

        job.output.cutline = undefined;
    });

    o('1 crosses, 1 outside', async () => {
        const cutline = new Cutline(GoogleTms, await Cutline.loadCutline(testDir + '/kapiti.geojson'));
        const cl2 = new Cutline(GoogleTms, await Cutline.loadCutline(testDir + '/mana.geojson'));
        cutline.clipPoly.push(...cl2.clipPoly);

        const vrt = await CogVrt.buildVrt(tmpFolder, job, cutline, qkToName('31133322'), logger);

        o(job.source.files).deepEquals([tif1, tif2]);
        o(cutline.clipPoly.length).equals(2);
        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
    });

    o('not within tile', async () => {
        const cutline = new Cutline(GoogleTms, await Cutline.loadCutline(testDir + '/kapiti.geojson'));

        const vrt = await CogVrt.buildVrt(tmpFolder, job, cutline, qkToName('3131110001'), logger);

        o(cutTiffArgs.length).equals(0);
        o(vrt).equals(null);
        o(runSpy.callCount).equals(0);
    });

    o('no cutline same projection', async () => {
        const vrt = await CogVrt.buildVrt(tmpFolder, job, new Cutline(GoogleTms), qkToName('31'), logger);

        o(job.source.files).deepEquals([tif1, tif2]);
        o(cutTiffArgs.length).equals(0);
        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
        o(runSpy.callCount).equals(2);
        o(runSpy.args[0]).equals('gdalwarp');
    });

    o('no cutline diff projection', async () => {
        job.output.tileMatrix = Nztm2000Tms.identifier; //EpsgCode.Nztm2000;
        const vrt = await CogVrt.buildVrt(tmpFolder, job, new Cutline(GoogleTms), qkToName('31'), logger);

        o(job.source.files).deepEquals([tif1, tif2]);
        o(cutTiffArgs.length).equals(0);
        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
        o(runSpy.callCount).equals(2);
        o(runSpy.args[0]).equals('gdalwarp');
    });

    o('fully within same projection', async () => {
        const cutline = new Cutline(GoogleTms, await Cutline.loadCutline(testDir + '/kapiti.geojson'), -100);

        const name = qkToName('311333222321113310');

        const vrt = await CogVrt.buildVrt(tmpFolder, job, cutline, name, logger);

        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
        o(cutTiffArgs.length).equals(0);
        o(runSpy.callCount).equals(2);
        o(runSpy.args[0]).equals('gdalwarp');
    });

    o('intersected cutline', async () => {
        const cutline = new Cutline(GoogleTms, await Cutline.loadCutline(testDir + '/kapiti.geojson'), 20);
        job.output.cutline = { blend: 20, href: 'cutline.json' };

        const name = qkToName('311333222321113');

        const vrt = await CogVrt.buildVrt(tmpFolder, job, cutline, name, logger);

        o(vrt).equals('/tmp/my-tmp-folder/cog.vrt');
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
                                        [19466735.795667, -4994548.30221],
                                        [19470103.691057, -4994548.30221],
                                        [19470215.804402, -4994433.114642],
                                        [19470856.681731, -4993478.14574],
                                        [19471932.55678, -4992600.063654],
                                        [19472332.955649, -4991978.915951],
                                        [19472332.955649, -4988739.08806],
                                        [19471286.516554, -4988739.08806],
                                        [19470978.43787, -4989417.445436],
                                        [19468800.977534, -4991497.540469],
                                        [19467511.856865, -4993217.174782],
                                        [19466735.795667, -4994548.30221],
                                    ],
                                ],
                            ],
                        },
                        properties: {},
                    },
                ],
                crs: {
                    type: 'name',
                    properties: { name: 'urn:ogc:def:crs:EPSG::3857' },
                },
            },
        ]);
    });

    o('1 surrounded with s3 files', async () => {
        const mount = o.spy();
        const setCredentials = o.spy();
        gdal.mount = mount;
        gdal.setCredentials = setCredentials;

        const vtif1 = '/vsis3' + tif1Path;
        const vtif2 = '/vsis3' + tif2Path;

        job.source.location = { type: 's3', path: 's3://foo/bar', roleArn: 'a:role:string' };

        job.source.files = job.source.files.map((o) => {
            o = Object.assign({}, o);
            o.name = 's3:/' + o.name;
            return o;
        });
        job.output.cutline = { blend: 10, href: 'cutline.json' };
        const cutline = new Cutline(GoogleTms, await Cutline.loadCutline(testDir + '/mana.geojson'));

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
                    [19455446.57501, -5025689.98761],
                    [19455543.12619, -5026720.78623],
                    [19457346.41188, -5024885.32147],
                    [19456570.81047, -5023799.46087],
                    [19456560.03196, -5023796.37227],
                    [19456551.09434, -5023782.48917],
                    [19456540.68564, -5023777.32429],
                    [19456531.22726, -5023778.34575],
                    [19456524.31633, -5023783.03837],
                    [19456521.12157, -5023788.06858],
                    [19456521.62607, -5023792.6091],
                    [19456528.41956, -5023802.39913],
                    [19456528.99998, -5023810.66149],
                    [19456513.95059, -5023820.48595],
                    [19456497.91736, -5023822.46951],
                    [19456431.41331, -5023815.14488],
                    [19456325.95579, -5024324.4265],
                    [19455446.57501, -5025689.98761],
                ],
            ],
        ]);

        o(runSpy.callCount).equals(2);
        o(mount.calls.map((c: any) => c.args[0])).deepEquals([tmpFolder, ...job.source.files.map((c) => c.name)]);

        o(setCredentials.calls.map((c: any) => c.args[0].service.config.params.RoleArn)).deepEquals(['a:role:string']);

        o(round((runSpy.calls[0] as any).args)).deepEquals([
            'gdalbuildvrt',
            ['-hidenodata', '-allow_projection_difference', '-addalpha', '/tmp/my-tmp-folder/source.vrt', vtif1, vtif2],
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
                '0.75',
                '0.75',
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

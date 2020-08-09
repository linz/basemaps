import { Bounds, EpsgCode } from '@basemaps/geo';
import { FileOperator, ProjectionTileMatrixSet } from '@basemaps/shared';
import { round } from '@basemaps/test/build/rounding';
import { Ring } from '@linzjs/geojson';
import o from 'ospec';
import { CogStacJob, extractYearRangeFromName, JobCreationContext } from '../cog.stac.job';
import { CogBuilderMetadata } from '../types';

o.spec('CogJob', () => {
    const googlePtms = ProjectionTileMatrixSet.get(EpsgCode.Google);
    const nztmPtms = ProjectionTileMatrixSet.get(EpsgCode.Nztm2000);

    o('extractYearRangeFromName', () => {
        o(extractYearRangeFromName('2013')).deepEquals([2013, 2014]);
        o(extractYearRangeFromName('abc2017def')).deepEquals([2017, 2018]);
        o(extractYearRangeFromName('2019_abc')).deepEquals([2019, 2020]);
        o(extractYearRangeFromName('12019_abc')).deepEquals([-1, -1]);
        o(extractYearRangeFromName('2019_abc2020')).deepEquals([2019, 2021]);
        o(extractYearRangeFromName('2020_abc2019')).deepEquals([2019, 2021]);
        o(extractYearRangeFromName('2020-23abc')).deepEquals([2020, 2024]);
    });

    o.spec('build', () => {
        const id = 'jobid1';
        const imageryName = 'auckland_rural_2010-2012_0-50m';

        const jobPath = 's3://target-bucket/path/3857/auckland_rural_2010-2012_0-50m/jobid1';

        const ring1 = [
            [170, -41],
            [-175, -40],
            [-177, -42],
            [175, -42],
            [170, -41],
        ].map(nztmPtms.proj.fromWgs84) as Ring;
        const ring2 = [
            [-150, -40],
            [-140, -41],
            [-150, -41],
            [-150, -40],
        ].map(nztmPtms.proj.fromWgs84) as Ring;

        const srcPoly = [[ring1], [ring2]];
        const bounds = srcPoly.map((poly, i) => ({ ...Bounds.fromMultiPolygon([poly]), name: 'ring' + i }));

        const metadata: CogBuilderMetadata = {
            bands: 3,
            bounds,
            projection: EpsgCode.Nztm2000,
            pixelScale: 0.075,
            resZoom: 22,
            nodata: 0,
            files: [{ name: '0-0-0', x: 1, y: 2, width: 2, height: 3 }],
            targetBounds: { x: 1, y: 2, width: 2, height: 3 },
        };
        const addAlpha = true;
        const ctx = {
            targetProjection: googlePtms,
            sourceLocation: { type: 's3', path: 's3://source-bucket/path' },
            outputLocation: { type: 's3', path: 's3://target-bucket/path' },
            cutline: { blend: 20, href: 's3://curline-bucket/path' },
            oneCogCovering: false,
        } as JobCreationContext;

        const origReadJson = FileOperator.readJson;
        const origWriteJson = FileOperator.writeJson;

        let mockFs: Record<string, any> = {};

        o.before(() => {
            FileOperator.readJson = async (path: string): Promise<any> => mockFs[path];
            FileOperator.writeJson = async (path: string, json: any): Promise<void> => {
                mockFs[path] = json;
            };
        });

        o.after(() => {
            FileOperator.readJson = origReadJson;
            FileOperator.writeJson = origWriteJson;
        });

        o.afterEach(() => {
            mockFs = {};
        });

        o('with job.json', async () => {
            mockFs['s3://source-bucket/path/collection.json'] = {
                title: 'The Title',
                description: 'The Description',
                license: 'The License',
                keywords: ['keywords'],
                extent: {
                    spatial: { bbox: [9, 8, 7, 6] },
                    temporal: { interval: [['2020-01-01T00:00:00.000', '2020-08-08T19:18:23.456Z']] },
                },

                providers: [{ name: 'provider name', roles: ['role1'], url: 'provider-url' }],
            };
            const job = await CogStacJob.create({ id, imageryName, metadata, ctx, addAlpha, cutlinePoly: [] });
            o(job.getJobPath('job.json')).equals(jobPath + '/job.json');

            o(job.title).equals('The Title');
            o(job.description).equals('The Description');

            const stac = round(mockFs[jobPath + '/collection.json'], 4);

            o(stac.title).equals('The Title');
            o(stac.description).equals('The Description');
            o(stac.license).equals('The License');
            o(stac.keywords).deepEquals(['keywords']);
            o(stac.providers).deepEquals([{ name: 'provider name', roles: ['role1'], url: 'provider-url' }]);
            o(stac.links[2]).deepEquals({
                href: 's3://source-bucket/path/collection.json',
                rel: 'sourceImagery',
                type: 'application/json',
            });
            o(round(stac.extent, 4)).deepEquals({
                spatial: { bbox: [169.3341, -51.8754, -146.1432, -32.8952] },
                temporal: {
                    interval: [['2020-01-01T00:00:00.000', '2020-08-08T19:18:23.456Z']],
                },
            });
        });

        o('no source collection.json', async () => {
            FileOperator.readJson = async (): Promise<any> => {
                throw { name: 'CompositeError', code: 404 };
            };
            const startNow = Date.now();
            const job = await CogStacJob.create({
                id,
                imageryName,
                metadata,
                ctx: { ...ctx, oneCogCovering: true },
                addAlpha,
                cutlinePoly: [],
            });
            const afterNow = Date.now();

            o(job.json).equals(mockFs[jobPath + '/job.json']);

            o(round(job.json, 4)).deepEquals({
                id: 'jobid1',
                name: 'auckland_rural_2010-2012_0-50m',
                title: 'Auckland rural 2010-2012 0.50m',
                description: undefined,
                source: {
                    gsd: 0.075,
                    epsg: 2193,
                    files: [
                        {
                            x: 1347679.1521,
                            y: 5301577.5257,
                            width: 1277913.1519,
                            height: 201072.6389,
                            name: 'ring0',
                        },
                        {
                            x: 4728764.4861,
                            y: 4246465.1768,
                            width: 838463.4123,
                            height: 610363.6056,
                            name: 'ring1',
                        },
                    ],
                    location: { type: 's3', path: 's3://source-bucket/path' },
                },
                output: {
                    gsd: 0.0373,
                    epsg: 3857,
                    files: [{ name: '0-0-0', x: 1, y: 2, width: 2, height: 3 }],
                    location: { type: 's3', path: 's3://target-bucket/path' },
                    resampling: { warp: 'bilinear', overview: 'lanczos' },
                    quality: 90,
                    cutline: { blend: 20, href: 's3://curline-bucket/path' },
                    addAlpha: true,
                    nodata: 0,
                    bounds: { x: 1, y: 2, width: 2, height: 3 },
                    oneCogCovering: true,
                },
            });

            o(job.id).equals(id);
            o(job.source.gsd).equals(0.075);
            o(round(job.output.gsd, 4)).equals(0.0373);
            o(job.output.oneCogCovering).equals(true);

            const stac = round(mockFs[jobPath + '/collection.json'], 4);

            const stacMeta = stac.summaries;

            const generated = stacMeta['linz:generated'][0];

            const jobNow = +Date.parse(generated.datetime);
            o(startNow <= jobNow && jobNow <= afterNow).equals(true);

            // split so that scripts/detect.unlinked.dep.js does not think it is an import
            o(generated.package).equals('@' + 'basemaps/cli');

            const exp = {
                id: 'jobid1',
                title: 'Auckland rural 2010-2012 0.50m',
                description: undefined,
                stac_version: '1.0.0',
                stac_extensions: ['proj', 'linz'],
                extent: {
                    spatial: { bbox: [169.3341, -51.8754, -146.1432, -32.8952] },
                    temporal: { interval: [['2010-01-01T00:00:00Z', '2011-01-01T00:00:00Z']] },
                },
                license: 'CC-BY-4.0',
                keywords: ['Imagery', 'New Zealand'],
                providers: [],
                summaries: {
                    gsd: [0.075],
                    'proj:epsg': [3857],
                    'linz:output': [
                        {
                            resampling: { warp: 'bilinear', overview: 'lanczos' },
                            quality: 90,
                            cutlineBlend: 20,
                            addAlpha: true,
                            nodata: 0,
                        },
                    ],
                    'linz:generated': [generated],
                },
                links: [
                    {
                        href: 's3://target-bucket/path/collection.json',
                        type: 'application/json',
                        rel: 'self',
                    },
                    {
                        href: 'job.json',
                        type: 'application/json',
                        rel: 'linz.basemaps.job',
                    },
                    {
                        href: 'cutline.geojson.gz',
                        type: 'application/geo+json+gzip',
                        rel: 'linz.basemaps.cutline',
                    },
                    {
                        href: 'covering.geojson',
                        type: 'application/geo+json',
                        rel: 'linz.basemaps.covering',
                    },
                    {
                        href: 'source.geojson',
                        type: 'application/geo+json',
                        rel: 'linz.basemaps.source',
                    },
                    { href: '0-0-0.json', type: 'application/json', rel: 'item' },
                ],
            };

            o(stac).deepEquals(exp);

            o(round(mockFs[jobPath + '/cutline.geojson.gz'], 4)).deepEquals({
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: { type: 'MultiPolygon', coordinates: [] },
                        properties: {},
                    },
                ],
                crs: {
                    type: 'name',
                    properties: { name: 'urn:ogc:def:crs:EPSG::3857' },
                },
            });

            o(round(mockFs[jobPath + '/0-0-0.json'], 4)).deepEquals({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [0, 0],
                            [0, 0],
                            [0, 0],
                            [0, 0],
                            [0, 0],
                        ],
                    ],
                },
                properties: { name: '0-0-0', gsd: 0.0373, 'proj:epsg': 3857 },
                bbox: [0, 0, 0, 0],
                id: 'jobid1/0-0-0',
                collection: 'jobid1',
                stac_version: '1.0.0',
                stac_extensions: ['proj'],
                links: [
                    { href: jobPath + '/0-0-0.json', rel: 'self' },
                    { href: 'collection.json', rel: 'collection' },
                ],
                assets: {
                    cog: {
                        href: '0-0-0.tiff',
                        type: 'image/tiff; application=geotiff; profile=cloud-optimized',
                        roles: ['data'],
                    },
                },
            });
            o(round(mockFs[jobPath + '/covering.geojson'], 4)).deepEquals({
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [0, 0],
                                    [0, 0],
                                    [0, 0],
                                    [0, 0],
                                    [0, 0],
                                ],
                            ],
                        },
                        properties: { name: '0-0-0' },
                        bbox: [0, 0, 0, 0],
                    },
                ],
            });

            o(round(mockFs[jobPath + '/source.geojson'], 4)).deepEquals({
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [
                                [
                                    [
                                        [169.9343, -42.3971],
                                        [180, -42.2199],
                                        [180, -40.4109],
                                        [170.0185, -40.5885],
                                        [169.9343, -42.3971],
                                    ],
                                ],
                                [
                                    [
                                        [-180, -42.2199],
                                        [-174.6708, -41.7706],
                                        [-175, -40],
                                        [-180, -40.4109],
                                        [-180, -42.2199],
                                    ],
                                ],
                            ],
                        },
                        properties: { name: 'ring0' },
                        bbox: [169.9343, -42.3971, -175, -40],
                    },
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [
                                [
                                    [-147.7182, -44.5617],
                                    [-150.6057, -40.2044],
                                    [-143.8327, -37.2693],
                                    [-142.0209, -41.3698],
                                    [-147.7182, -44.5617],
                                ],
                            ],
                        },
                        properties: { name: 'ring1' },
                        bbox: [-147.7182, -44.5617, -143.8327, -37.2693],
                    },
                ],
            });
        });
    });
});

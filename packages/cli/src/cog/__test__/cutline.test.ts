import { EpsgCode, Bounds, GoogleTms, Nztm2000Tms } from '@basemaps/geo';
import { qkToName } from '@basemaps/shared/build/proj/__test__/test.util';
import { round } from '@basemaps/test/build/rounding';
import o from 'ospec';
import { Cutline, polyContainsBounds } from '../cutline';
import { SourceMetadata } from '../types';
import { SourceTiffTestHelper } from './source.tiff.testhelper';
import { MultiPolygon } from '@linzjs/geojson';

o.spec('cutline', () => {
    const testDir = `${__dirname}/../../../__test.assets__`;

    o.spec('filterSourcesForName', () => {
        o('fully within same projection', async () => {
            // convert poly to GoogleTms
            const cutpoly = new Cutline(GoogleTms, await Cutline.loadCutline(testDir + '/kapiti.geojson')).toGeoJson();

            const cutline = new Cutline(GoogleTms, cutpoly, -100);

            const name = qkToName('311333222321113310');

            const job = SourceTiffTestHelper.makeCogJob();
            job.output.tileMatrix = GoogleTms.identifier;
            job.source.epsg = EpsgCode.Nztm2000;
            const sourceBounds = SourceTiffTestHelper.tiffNztmBounds(testDir);
            const [tif1, tif2] = sourceBounds;
            job.source.files = [tif1, tif2];

            o(cutline.filterSourcesForName(name, job)).deepEquals([tif2.name]);
        });
    });

    o('polyContainsBounds', () => {
        const polys: MultiPolygon = [
            [
                [
                    [-4, 2],
                    [-2, 1],
                    [-4, -1],
                    [1, -5],
                    [2, -5],
                    [2, -2],
                    [4, -5],
                    [6, -2],
                    [2, 0],
                    [6, 3],
                    [2, 7],
                    [0, 3],
                    [-4, 6],
                    [-4, 10],
                    [10, 10],
                    [10, -10],
                    [-10, -10],
                    [-4, 2],
                ],
            ],
            [
                [
                    [2, 3],
                    [3, 3],
                    [3, 5],
                    [2, 5],
                    [2, 3],
                ],
            ],
        ];

        o(polyContainsBounds(polys, Bounds.fromBbox([-6, -6, -3, -3]))).equals(true);

        o(polyContainsBounds(polys, Bounds.fromBbox([-3, -4, 4, 4]))).equals(false);
        o(polyContainsBounds(polys, Bounds.fromBbox([6, -8, 5, 5]))).equals(false);
    });

    o('loadCutline', async () => {
        const cutline = new Cutline(GoogleTms, await Cutline.loadCutline(testDir + '/mana.geojson'));
        const geojson = round(cutline.toGeoJson());

        o(geojson).deepEquals({
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [19456570.81047118, -5023799.46086743],
                                    [19457346.41188008, -5024885.32147075],
                                    [19455543.1261867, -5026720.78623442],
                                    [19455446.57500747, -5025689.98761053],
                                    [19456325.95579277, -5024324.4264959],
                                    [19456431.41331051, -5023815.14487631],
                                    [19456497.91735541, -5023822.4695137],
                                    [19456513.95059036, -5023820.4859541],
                                    [19456528.99998363, -5023810.66149213],
                                    [19456528.41956381, -5023802.3991344],
                                    [19456521.62606925, -5023792.60909871],
                                    [19456521.12156931, -5023788.06857522],
                                    [19456524.31632738, -5023783.03836819],
                                    [19456531.227264, -5023778.34574544],
                                    [19456540.68563587, -5023777.32428773],
                                    [19456551.09434221, -5023782.4891701],
                                    [19456560.03196148, -5023796.37226942],
                                    [19456570.81047118, -5023799.46086743],
                                ],
                            ],
                            [
                                [
                                    [19430214.06028324, -5008476.23288268],
                                    [19429858.86076585, -5008966.74650194],
                                    [19430484.68848696, -5009778.63111311],
                                    [19430907.54505528, -5009085.14634107],
                                    [19430214.06028324, -5008476.23288268],
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
        });
    });

    o('findCovering', async () => {
        const cutline = new Cutline(GoogleTms, await Cutline.loadCutline(testDir + '/mana.geojson'));
        const bounds = SourceTiffTestHelper.tiffNztmBounds();

        o(cutline.clipPoly.length).equals(2);

        (cutline as any).findCovering({ projection: EpsgCode.Nztm2000, bounds, resZoom: 15 });

        o((cutline as any).srcPoly.length).equals(1);
    });

    o.spec('optmize', async () => {
        const bounds = SourceTiffTestHelper.tiffNztmBounds();
        o('one-cog', () => {
            const cutline = new Cutline(Nztm2000Tms, undefined, 0, true);
            const covering = cutline.optimizeCovering({
                projection: EpsgCode.Nztm2000,
                bounds,
                resZoom: 14,
            } as SourceMetadata);

            o(covering.length).equals(1);
            o(covering[0]).deepEquals({
                x: 274000,
                y: 3087000,
                width: 3053000,
                height: 4086000,
                name: '0-0-0',
            });
        });

        o('full-extent 3857', () => {
            const cutline = new Cutline(GoogleTms);
            const covering = cutline.optimizeCovering({
                projection: EpsgCode.Google,
                bounds: [{ ...GoogleTms.extent, name: 'gebco' }],
                resZoom: 5,
            } as SourceMetadata);

            o(round(covering, 4)).deepEquals([
                {
                    name: '1-0-0',
                    x: -20037508.3428,
                    y: 0,
                    width: 20037508.3428,
                    height: 20037508.3428,
                },
                {
                    name: '1-0-1',
                    x: -20037508.3428,
                    y: -20037508.3428,
                    width: 20037508.3428,
                    height: 20037508.3428,
                },
                {
                    name: '1-1-0',
                    x: -0,
                    y: 0,
                    width: 20037508.3428,
                    height: 20037508.3428,
                },
                {
                    name: '1-1-1',
                    x: -0,
                    y: -20037508.3428,
                    width: 20037508.3428,
                    height: 20037508.3428,
                },
            ]);
        });

        o('nztm', () => {
            const cutline = new Cutline(Nztm2000Tms);

            const covering = cutline.optimizeCovering({
                projection: EpsgCode.Nztm2000,
                bounds,
                resZoom: 14,
            } as SourceMetadata);

            o(covering[4]).deepEquals({
                name: '7-153-253',
                x: 1741760,
                y: 5448320,
                width: 17920,
                height: 17920,
            });
            o(covering.map((c) => c.name)).deepEquals([
                '7-152-252',
                '7-152-253',
                '7-152-254',
                '7-153-252',
                '7-153-253',
                '7-153-254',
                '7-154-252',
                '7-154-253',
                '7-154-254',
                '7-155-252',
                '7-155-253',
                '8-387-635',
            ]);
        });

        o('source polygon is smoothed', async () => {
            const tiff1 = {
                name: '/path/to/tiff1.tiff',
                x: 1759315.9336568,
                y: 5476120.089572778,
                width: 2577.636033663526,
                height: 2275.3233966259286,
            };

            const tiff2 = {
                name: '/path/to/tiff2.tiff',
                x: 1759268.0010635862,
                y: 5473899.771969615,
                width: 2576.894309356343,
                height: 2275.3359155077487,
            };

            const bounds = [tiff1, tiff2];
            const cutline = new Cutline(GoogleTms, await Cutline.loadCutline(testDir + '/kapiti.geojson'), 500);

            const covering = cutline.optimizeCovering({
                projection: EpsgCode.Nztm2000,
                bounds,
                resZoom: 22,
            } as SourceMetadata);

            o(round(cutline.clipPoly, 4)).deepEquals([
                [
                    [
                        [19468580.0838, -4993280.8853],
                        [19471098.3762, -4993280.8853],
                        [19471932.5568, -4992600.0637],
                        [19472092.0139, -4992352.6942],
                        [19472092.0139, -4987203.6846],
                        [19471983.8261, -4987203.6846],
                        [19470978.4379, -4989417.4454],
                        [19468800.9775, -4991497.5405],
                        [19468580.0838, -4991792.2037],
                        [19468580.0838, -4993280.8853],
                    ],
                ],
            ]);

            o(covering.map((c) => c.name)).deepEquals([
                '14-16151-10232',
                '14-16151-10233',
                '14-16152-10231',
                '14-16152-10232',
                '14-16152-10233',
                '18-258444-163695',
            ]);
        });

        o('boundary part inland, part coastal', async () => {
            const cutline = new Cutline(GoogleTms, await Cutline.loadCutline(testDir + '/kapiti.geojson'), 500);
            const bounds = [
                {
                    name: 'tiff1',
                    x: 1759315.9336568,
                    y: 5476120.089572778,
                    width: 2577.636033663526,
                    height: 2275.3233966259286,
                },
            ];

            const covering = cutline.optimizeCovering({
                projection: EpsgCode.Nztm2000,
                bounds,
                resZoom: 22,
            } as SourceMetadata);

            o(round(cutline.clipPoly, 4)).deepEquals([
                [
                    [
                        [19470015.7313, -4990337.1045],
                        [19472091.9684, -4990337.1045],
                        [19472091.9684, -4987203.6846],
                        [19471983.8261, -4987203.6846],
                        [19470978.4379, -4989417.4454],
                        [19470015.7313, -4990337.1045],
                    ],
                ],
            ]);

            o(covering.map((c) => c.name)).deepEquals([
                '14-16152-10231',
                '15-32304-20464',
                '15-32305-20464',
                '18-258444-163695',
            ]);
        });

        o('low res', () => {
            const cutline = new Cutline(GoogleTms);

            const covering = cutline.optimizeCovering({
                projection: EpsgCode.Nztm2000,
                bounds,
                resZoom: 13,
            } as SourceMetadata);

            o(covering.length).equals(covering.length);
            o(covering.map((c) => c.name)).deepEquals(['8-252-159', '8-252-160']);
        });

        o('hi res', () => {
            const covering2 = new Cutline(GoogleTms).optimizeCovering({
                projection: EpsgCode.Nztm2000,
                bounds,
                resZoom: 18,
            } as SourceMetadata);

            o(covering2.length).equals(covering2.length);

            o(covering2.map((c) => c.name)).deepEquals([
                '10-1008-639',
                '10-1008-640',
                '10-1009-639',
                '10-1009-640',
                '11-2020-1279',
                '11-2020-1280',
                '12-4040-2557',
                '12-4040-2562',
            ]);
        });
    });
});

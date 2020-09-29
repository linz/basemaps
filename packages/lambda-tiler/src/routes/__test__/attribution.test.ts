import { Epsg, EpsgCode } from '@basemaps/geo';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { HttpHeader } from '@basemaps/lambda';
import {
    Aws,
    NamedBounds,
    ProjectionTileMatrixSet,
    StacLicense,
    TileMetadataImageRuleV2,
    TileMetadataImageryRecord,
    TileMetadataProviderRecord,
} from '@basemaps/shared';
import { mockFileOperator } from '@basemaps/shared/build/file/__test__/file.operator.test.helper';
import { round } from '@basemaps/test/build/rounding';
import o from 'ospec';
import { TileSets } from '../../tile.set.cache';
import { FakeTileSet, mockRequest, Provider } from '../../__test__/xyz.util';
import { attribution } from '../attribution';
import { TileEtag } from '../tile.etag';

o.spec('attribution', () => {
    o.spec('fetch', () => {
        const origTileEtag = TileEtag.generate;
        const generateMock = o.spy(() => 'foo');
        const TileSetNames = ['aerial', 'aerial@head', 'aerial@beta', '01E7PJFR9AMQFJ05X9G7FQ3XMW'];

        const mockFs = mockFileOperator();

        const makeImageRecord = (name: string, x = 10, year = 2019): TileMetadataImageryRecord => {
            return {
                v: 1,
                id: name,
                name,
                projection: EpsgCode.Google,
                year,
                uri: 's3://bucket/path/' + name,
                bounds: GoogleTms.tileToSourceBounds({ x, y: 10, z: 5 }),
                resolution: 750,
                files: [0, 1].map((i) => {
                    const b = GoogleTms.tileToSourceBounds({ x, y: 10, z: 5 }).toJson() as NamedBounds;
                    b.name = name + i;
                    b.width /= 8;
                    b.height /= 8;
                    b.x += i * b.width;
                    return b;
                }),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
        };

        o.beforeEach(() => {
            mockFs.setup();
            TileEtag.generate = generateMock;
            // Mock the tile generation
            for (const tileSetName of TileSetNames) {
                for (const code of ProjectionTileMatrixSet.targetCodes()) {
                    const tileSet = new FakeTileSet(tileSetName, Epsg.get(code));
                    tileSet.tileSet.version = 23;
                    TileSets.set(tileSet.id, tileSet);
                    const rules: TileMetadataImageRuleV2[] = [];
                    const imagery = new Map<string, TileMetadataImageryRecord>();
                    const addRule = (id: string, name: string, minZoom = 10): void => {
                        imagery.set(id, makeImageRecord(name, minZoom));
                        rules.push({
                            imgId: id,
                            ruleId: 'ir_' + id,
                            minZoom,
                            maxZoom: minZoom + 2,
                            priority: minZoom * 10,
                        });
                    };
                    addRule('ir_1', 'image1', 14);
                    addRule('ir_2', 'image2', 15);
                    addRule('ir_3', 'hastings-district_urban_2017-18_0.1m', 16);
                    addRule('ir_4', 'image1', 14);
                    tileSet.tileSet.rules = rules;
                    tileSet.imagery = imagery;
                    tileSet.load = (): Promise<boolean> => Promise.resolve(true);
                }
            }

            (Aws.tileMetadata.Provider as any).get = async (): Promise<TileMetadataProviderRecord> => Provider;
        });

        o.afterEach(() => {
            mockFs.teardown();
            TileSets.clear();
            TileEtag.generate = origTileEtag;
        });

        o('notFound', async () => {
            const request = mockRequest(`/v1/attribution/aerial/1234/summary.json`);
            const res = await attribution(request);

            o(res.status).equals(404);
        });

        o('etag mismatch', async () => {
            mockFs.jsStore['s3://bucket/path/image1/collection.json'] = {
                extent: {
                    spatial: { bbox: [1, 2, 3, 4] },
                    temporal: { interval: [['2018-02-03T01:02:03Z', '2018-09-13T11:32:43Z']] },
                },
                title: 'image one',
                description: 'image one description',
                license: StacLicense,
                providers: [
                    {
                        name: 'p1',
                    },
                ],
                summaries: {
                    gsd: [0.75],
                },
            };
            mockFs.jsStore['s3://bucket/path/image2/collection.json'] = {
                extent: {
                    spatial: { bbox: [5, 6, 7, 8] },
                    temporal: { interval: [['2016-02-03T01:02:03Z', '2018-09-13T11:32:43Z']] },
                },
                summaries: {
                    gsd: [0.5],
                },
            };

            const request = mockRequest(`/v1/attribution/aerial/EPSG:3857/summary.json`);
            const res = await attribution(request);

            o(res.status).equals(200);
            o(res.header(HttpHeader.ETag)).equals('v1.23');
            o(res.header(HttpHeader.CacheControl)).equals('public, max-age=86400, stale-while-revalidate=604800');

            const body = round(JSON.parse(res.body as string), 4);

            o(body).deepEquals({
                id: 'aerial_3857',
                type: 'FeatureCollection',
                stac_version: '1.0.0-beta.2',
                stac_extensions: ['single-file-stac'],
                title: 'aerial:title',
                description: 'aerial:description',
                features: [
                    {
                        type: 'Feature',
                        stac_version: '1.0.0-beta.2',
                        id: 'ir_ir_1_item',
                        collection: 'ir_ir_1',
                        assets: {},
                        links: [],
                        bbox: [-22.5, 48.9225, -11.25, 55.7766],
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [
                                [
                                    [
                                        [-22.5, 48.9225],
                                        [-19.6875, 48.9225],
                                        [-19.6875, 49.838],
                                        [-22.5, 49.838],
                                        [-22.5, 48.9225],
                                    ],
                                ],
                            ],
                        },
                        properties: {
                            datetime: null,
                            start_datetime: '2018-02-03T01:02:03Z',
                            end_datetime: '2018-09-13T11:32:43Z',
                        },
                    },
                    {
                        type: 'Feature',
                        stac_version: '1.0.0-beta.2',
                        id: 'ir_ir_2_item',
                        collection: 'ir_ir_2',
                        assets: {},
                        links: [],
                        bbox: [-11.25, 48.9225, 0, 55.7766],
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [
                                [
                                    [
                                        [-11.25, 48.9225],
                                        [-8.4375, 48.9225],
                                        [-8.4375, 49.838],
                                        [-11.25, 49.838],
                                        [-11.25, 48.9225],
                                    ],
                                ],
                            ],
                        },
                        properties: {
                            datetime: null,
                            start_datetime: '2016-02-03T01:02:03Z',
                            end_datetime: '2018-09-13T11:32:43Z',
                        },
                    },
                    {
                        type: 'Feature',
                        stac_version: '1.0.0-beta.2',
                        id: 'ir_ir_3_item',
                        collection: 'ir_ir_3',
                        assets: {},
                        links: [],
                        bbox: [0, 48.9225, 11.25, 55.7766],
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [
                                [
                                    [
                                        [-0, 48.9225],
                                        [2.8125, 48.9225],
                                        [2.8125, 49.838],
                                        [-0, 49.838],
                                        [-0, 48.9225],
                                    ],
                                ],
                            ],
                        },
                        properties: {
                            datetime: null,
                            start_datetime: '2017-01-01T00:00:00Z',
                            end_datetime: '2019-01-01T00:00:00Z',
                        },
                    },
                    {
                        type: 'Feature',
                        stac_version: '1.0.0-beta.2',
                        id: 'ir_ir_4_item',
                        collection: 'ir_ir_4',
                        assets: {},
                        links: [],
                        bbox: [-22.5, 48.9225, -11.25, 55.7766],
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: [
                                [
                                    [
                                        [-22.5, 48.9225],
                                        [-19.6875, 48.9225],
                                        [-19.6875, 49.838],
                                        [-22.5, 49.838],
                                        [-22.5, 48.9225],
                                    ],
                                ],
                            ],
                        },
                        properties: {
                            datetime: null,
                            start_datetime: '2018-02-03T01:02:03Z',
                            end_datetime: '2018-09-13T11:32:43Z',
                        },
                    },
                ],
                collections: [
                    {
                        stac_version: '1.0.0-beta.2',
                        license: 'CC BY 4.0',
                        id: 'ir_ir_1',
                        providers: [{ name: 'p1' }],
                        title: 'image one',
                        description: 'image one description',
                        extent: {
                            spatial: { bbox: [[-22.5, 48.9225, -11.25, 55.7766]] },
                            temporal: {
                                interval: [['2018-02-03T01:02:03Z', '2018-09-13T11:32:43Z']],
                            },
                        },
                        links: [],
                        summaries: {
                            gsd: [0.75],
                            'linz:zoom': { min: 14, max: 16 },
                            'linz:priority': [140],
                        },
                    },
                    {
                        stac_version: '1.0.0-beta.2',
                        license: StacLicense,
                        id: 'ir_ir_2',
                        providers: [
                            {
                                name: 'the name',
                                url: 'https://example.provider.com',
                                roles: ['host'],
                            },
                        ],
                        title: 'Image2',
                        description: 'No description',
                        extent: {
                            spatial: { bbox: [[-11.25, 48.9225, 0, 55.7766]] },
                            temporal: {
                                interval: [['2016-02-03T01:02:03Z', '2018-09-13T11:32:43Z']],
                            },
                        },
                        links: [],
                        summaries: {
                            gsd: [0.5],
                            'linz:zoom': { min: 15, max: 17 },
                            'linz:priority': [150],
                        },
                    },
                    {
                        stac_version: '1.0.0-beta.2',
                        license: StacLicense,
                        id: 'ir_ir_3',
                        providers: [
                            {
                                name: 'the name',
                                url: 'https://example.provider.com',
                                roles: ['host'],
                            },
                        ],
                        title: 'Hastings-district urban 2017-18 0.1m',
                        description: 'No description',
                        extent: {
                            spatial: { bbox: [[0, 48.9225, 11.25, 55.7766]] },
                            temporal: {
                                interval: [['2017-01-01T00:00:00Z', '2019-01-01T00:00:00Z']],
                            },
                        },
                        links: [],
                        summaries: {
                            gsd: [0.75],
                            'linz:zoom': { min: 16, max: 18 },
                            'linz:priority': [160],
                        },
                    },
                    {
                        stac_version: '1.0.0-beta.2',
                        license: StacLicense,
                        id: 'ir_ir_4',
                        providers: [{ name: 'p1' }],
                        title: 'image one',
                        description: 'image one description',
                        extent: {
                            spatial: { bbox: [[-22.5, 48.9225, -11.25, 55.7766]] },
                            temporal: {
                                interval: [['2018-02-03T01:02:03Z', '2018-09-13T11:32:43Z']],
                            },
                        },
                        links: [],
                        summaries: {
                            gsd: [0.75],
                            'linz:zoom': { min: 14, max: 16 },
                            'linz:priority': [140],
                        },
                    },
                ],
                links: [],
            });
        });

        o('etag match', async () => {
            const request = mockRequest(`/v1/attribution/aerial/EPSG:3857/summary.json`, 'get', {
                [HttpHeader.IfNoneMatch]: 'v1.23',
            });
            const res = await attribution(request);

            o(res.status).equals(304);
        });
    });
});

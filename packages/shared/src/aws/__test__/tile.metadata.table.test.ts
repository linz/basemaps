import { Bounds, Epsg } from '@basemaps/geo';
import { round } from '@basemaps/test/build/rounding';
import * as AWS from 'aws-sdk';
import * as o from 'ospec';
import { Const } from '../../const';
import { qkToNamedBounds } from '../../tms/__test__/test.util';
import { TileMetadataTable } from '../tile.metadata';
import { TileMetadataImageRule, TileMetadataImageryRecordV1, TileMetadataSetRecord } from '../tile.metadata.base';

const { marshall } = AWS.DynamoDB.Converter;

o.spec('tile.metadata.table', () => {
    const { now } = Date;
    const mockNow = Date.now();

    function* genRules(max: number): Generator<TileMetadataImageRule> {
        let num = 0;
        while (num < max) yield { id: 'im_' + num++, maxZoom: 0, minZoom: 0, priority: num };
    }

    function genMap(ids: IterableIterator<TileMetadataImageRule>): Record<string, TileMetadataImageRule> {
        const output: Record<string, TileMetadataImageRule> = {};
        for (const im of ids) output[im.id] = im;
        return output;
    }

    o.before(() => {
        Date.now = (): number => mockNow;
    });

    o.after(() => {
        Date.now = now;
    });

    o('should create records in DynamoDB', async () => {
        const tmtable = new TileMetadataTable();

        let putItemPromiseCalled = false;
        let putItemParams: any;

        (tmtable as any).dynamo = {
            putItem(params: any): any {
                putItemParams = params;
                return {
                    async promise(): Promise<void> {
                        putItemPromiseCalled = true;
                    },
                };
            },
        };

        const files = qkToNamedBounds(['31311001', '3113332223']);

        const id = await tmtable.put({
            v: 1,
            id: 'testid',
            name: 'test-imagery',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            uri: 's3://test-bucket/etc/etc',
            projection: Epsg.Google.code,
            year: 2019,
            resolution: 300,
            bounds: Bounds.union(files).toJson(),
            files,
        } as TileMetadataImageryRecordV1);

        o(id).equals('testid');

        o(putItemPromiseCalled).equals(true);

        o(putItemParams).deepEquals({
            TableName: 'TileMetadata',
            Item: marshall({
                v: 1,
                id: 'testid',
                name: 'test-imagery',
                createdAt: mockNow,
                updatedAt: mockNow,
                uri: 's3://test-bucket/etc/etc',
                projection: Epsg.Google.code,
                year: 2019,
                resolution: 300,
                bounds: Bounds.union(files).toJson(),
                files,
            }),
        });
    });

    o('should sort imagery', async () => {
        const { Imagery } = new TileMetadataTable();

        const rules = Array.from(genRules(2));

        const files = qkToNamedBounds(['313']);

        const imagery = rules.map((r) => ({
            v: 1,
            id: r.id,
            projection: Epsg.Google.code,
            year: 2001,
            resolution: 100,
            bounds: Bounds.union(files).toJson(),
            files,
        })) as TileMetadataImageryRecordV1[];

        for (const i of imagery) {
            Imagery.imagery.set(i.id, i);
        }

        const tsData = {
            createdAt: 0,
            updatedAt: 0,
            id: 'ts_aerial_3857',
            version: 0,
            imagery: genMap(rules.values()),
            name: 'aerial',
            projection: Epsg.Google.code,
        } as TileMetadataSetRecord;

        const getAll = async (): Promise<string[]> => (await Imagery.getAll(tsData)).map((i) => i.imagery.id);

        o(await getAll()).deepEquals(['im_0', 'im_1']);

        rules[0].priority = rules[1].priority;
        o(await getAll()).deepEquals(['im_0', 'im_1']);

        imagery[0].year = 2020;
        o(await getAll()).deepEquals(['im_1', 'im_0']);

        imagery[1].year = 2020;
        imagery[1].resolution = 3000;
        o(await getAll()).deepEquals(['im_1', 'im_0']);
    });

    o('should report missing imagery', async () => {
        const tmtable = new TileMetadataTable();

        (tmtable as any).dynamo = {
            batchGetItem(): any {
                return {
                    async promise(): Promise<any> {
                        return {
                            Responses: {
                                [Const.TileMetadata.TableName]: [marshall({ id: 'im_1' }), marshall({ id: 'im_3' })],
                            },
                        };
                    },
                };
            },
        };

        tmtable.Imagery.imagery.set('im_4', { id: 'im_4' } as any);

        let err: Error | null = null;
        try {
            await tmtable.Imagery.getAll({
                createdAt: 0,
                updatedAt: 0,
                id: 'ts_aerial_3857',
                version: 0,
                imagery: genMap(genRules(5)),
                name: 'aerial',
                projection: Epsg.Google.code,
            });
        } catch (_err) {
            err = _err;
        }

        o(err?.message).equals('Missing fetched items\nim_0, im_2');
    });

    o('should getAllImagery', async () => {
        const tmtable = new TileMetadataTable();

        let actualParams: any;

        (tmtable as any).dynamo = {
            batchGetItem(params: any): any {
                actualParams = params;
                return {
                    async promise(): Promise<any> {
                        const files = qkToNamedBounds(['313']);
                        return {
                            Responses: {
                                [Const.TileMetadata.TableName]: actualParams.RequestItems[
                                    Const.TileMetadata.TableName
                                ].Keys.map((i: any) =>
                                    marshall({
                                        v: 1,
                                        id: i.id.S,
                                        projection: Epsg.Google.code,
                                        year: 2001,
                                        resolution: 100,
                                        bounds: Bounds.union(files),
                                        files,
                                    }),
                                ),
                            },
                        };
                    },
                };
            },
        };

        const tsData = {
            createdAt: 0,
            updatedAt: 0,
            id: 'ts_aerial_3857',
            version: 0,
            imagery: genMap(genRules(202)),
            name: 'aerial',
            projection: Epsg.Google.code,
        } as TileMetadataSetRecord;

        const ans = await tmtable.Imagery.getAll(tsData);

        o(ans.length).equals(202);
        const im199 = round(
            ans.find((r) => r.imagery.id === 'im_199'),
            4,
        );
        o(im199).deepEquals({
            rule: { id: 'im_199', maxZoom: 0, minZoom: 0, priority: 200 },
            imagery: {
                v: 1,
                id: 'im_199',
                projection: 3857,
                year: 2001,
                resolution: 100,
                bounds: {
                    x: 15028131.2571,
                    y: -10018754.1714,
                    width: 5009377.0857,
                    height: 5009377.0857,
                },
                files: [
                    {
                        name: '3-7-5',
                        x: 15028131.2571,
                        y: -10018754.1714,
                        width: 5009377.0857,
                        height: 5009377.0857,
                    },
                ],
            },
        });

        o(ans.slice(0, 5).map((r) => r.rule.id)).deepEquals(['im_0', 'im_1', 'im_2', 'im_3', 'im_4']);
    });
});

import { EPSG } from '@basemaps/geo';
import * as AWS from 'aws-sdk';
import * as o from 'ospec';
import { Const } from '../../const';
import { TileMetadataImageryRecord, TileMetadataTable } from '../tile.metadata.table';

const { marshall } = AWS.DynamoDB.Converter;

o.spec('tile.metadata.table', () => {
    const { now } = Date;
    const mockNow = Date.now();

    function* genIds(max: number): any {
        let num = 0;
        while (num < max) yield { id: 'im_' + num++, maxZoom: 0, minZoom: 0 };
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

        const id = await tmtable.create({
            id: 'testid',
            name: 'test-imagery',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            projection: EPSG.Google,
            year: 2019,
            resolution: 300,
            quadKeys: ['31311001', '3113332223'],
        });

        o(id).equals('testid');

        o(putItemPromiseCalled).equals(true);

        o(putItemParams).deepEquals({
            TableName: 'TileMetadata',
            Item: marshall({
                id: 'testid',
                name: 'test-imagery',
                createdAt: mockNow,
                updatedAt: mockNow,
                projection: EPSG.Google,
                year: 2019,
                resolution: 300,
                quadKeys: ['31311001', '3113332223'],
            }),
        });
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

        tmtable.imagery.set('im_4', { id: 'im_4' } as any);

        let err: Error | null = null;
        try {
            await tmtable.getAllImagery({
                createdAt: 0,
                updatedAt: 0,
                id: 'ts_aerial_3857',
                imagery: Array.from(genIds(5)),
                name: 'aerial',
                projection: EPSG.Google,
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
                        return {
                            Responses: {
                                [Const.TileMetadata.TableName]: actualParams.RequestItems[
                                    Const.TileMetadata.TableName
                                ].Keys.map((i: any) =>
                                    marshall({
                                        id: i.id.S,
                                        projection: EPSG.Google,
                                        year: 2001,
                                        resolution: 100,
                                        quadKeys: ['313'],
                                    }),
                                ),
                            },
                        };
                    },
                };
            },
        };

        const ans = await tmtable.getAllImagery({
            createdAt: 0,
            updatedAt: 0,
            id: 'ts_aerial_3857',
            imagery: Array.from(genIds(202)),
            name: 'aerial',
            projection: EPSG.Google,
        });

        o(ans.size).equals(202);
        o(ans.get('im_199')).deepEquals({
            id: 'im_199',
            projection: EPSG.Google,
            year: 2001,
            resolution: 100,
            quadKeys: ['313'],
        } as TileMetadataImageryRecord);
    });
});

import { EPSG } from '@basemaps/geo';
import * as AWS from 'aws-sdk';
import * as o from 'ospec';
import { TileMetadataTable } from '../tile.metadata.table';

/* eslint-disable @typescript-eslint/explicit-function-return-type */
o.spec('tile.metadata.table', () => {
    const { now } = Date;
    const mockNow = Date.now();

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
            Item: AWS.DynamoDB.Converter.marshall({
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
});

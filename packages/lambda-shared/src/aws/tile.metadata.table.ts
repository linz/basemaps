import { EPSG } from '@basemaps/geo';
import { DynamoDB } from 'aws-sdk';
import { Const } from '../const';
import { BaseDynamoTable } from './aws.dynamo.table';

/**
 * The database format for the ApiKey Table
 */
export type TileMetadataRecord = TileMetadataImageryRecord | TileMetadataSetRecord;

export interface TileMetadataImageryRecord extends BaseDynamoTable {
    /** Imagery set name */
    name: string;

    projection: EPSG.Google;

    /** Year the imagery was acquired */
    year: number;

    /** Resolution of imagery in MM */
    resolution: number;

    /** list of quad keys the imagery contains */
    quadKeys: string[];
}

export interface TileMetadataImageRule {
    /** Unique imagery id  (prefix: im_)*/
    id: string;

    /** Minimal zoom to show the layer @default 0 */
    minZoom: number;

    /** Max zoom to show the layer @default 32 */
    maxZoom: number;
}

export interface TileMetadataSetRecord extends BaseDynamoTable {
    /** TileSet set name */
    name: string;

    projection: EPSG.Google;
    /** Order is important, order is render order, first record is the first record drawn onto a tile */
    imagery: TileMetadataImageRule[];
}

export enum RecordPrefix {
    Imagery = 'im',
    TileSet = 'ts',
}

function toId(id: string): { id: { S: string } } {
    return { id: { S: id } };
}

export class TileMetadataTable {
    imagery = new Map<string, TileMetadataImageryRecord>();
    dynamo: DynamoDB;

    public constructor() {
        this.dynamo = new DynamoDB({});
    }

    static prefix(prefix: RecordPrefix, id: string): string {
        if (id.startsWith(prefix)) return id;
        return `${id}_${prefix}`;
    }

    static unprefix(prefix: RecordPrefix, id: string): string {
        if (id.startsWith(prefix)) return id.substr(3);
        return id;
    }

    public async getTileSet(name: string, projection: EPSG): Promise<TileMetadataSetRecord> {
        const key = `ts_${name}_${projection}`;
        // TODO sort key needed for versioning
        // const sortKey = 'v0';

        const item = await this.dynamo
            .getItem({
                Key: toId(key),
                TableName: Const.TileMetadata.TableName,
            })
            .promise();

        if (item == null || item.Item == null) throw new Error(`Unable to find tile set: ${key}`);

        return DynamoDB.Converter.unmarshall(item.Item) as TileMetadataSetRecord;
    }

    public async getAllImagery(record: TileMetadataSetRecord): Promise<Map<string, TileMetadataImageryRecord>> {
        const imageList = new Set(record.imagery.map((c) => c.id));
        const output = new Map<string, TileMetadataImageryRecord>();
        for (const r of record.imagery) {
            const existing = this.imagery.get(r.id);
            if (existing == null) continue;
            imageList.delete(r.id);
            output.set(existing.id, existing);
        }

        if (imageList.size > 0) {
            const items = await this.fetchImagery(Array.from(imageList.values()));
            for (const item of items) output.set(item.id, item);
        }

        return output;
    }

    /**
     * Fetch imagery from the store
     * @param Keys Imagery ids (already prefixed `im_${key}`)
     */
    private async fetchImagery(keys: string[]): Promise<TileMetadataImageryRecord[]> {
        // TODO run multiple requests
        if (keys.length > 100) throw new Error('BatchGet only allows 100 keys');

        const Keys = keys.map(toId);
        const items = await this.dynamo
            .batchGetItem({
                RequestItems: {
                    [Const.TileMetadata.TableName]: { Keys },
                },
            })
            .promise();

        const metadataItems = items.Responses?.[Const.TileMetadata.TableName];
        if (metadataItems == null) throw new Error('Failed to fetch tile metadata');

        // TODO diff the arrays see what is missing?
        if (metadataItems.length < Keys.length) throw new Error('Missing fetched items');

        const results = metadataItems.map((c) => DynamoDB.Converter.unmarshall(c)) as TileMetadataImageryRecord[];

        for (const result of results) this.imagery.set(result.id, result);

        return results;
    }

    public async create(record: TileMetadataRecord): Promise<string> {
        await this.dynamo
            .putItem({
                TableName: Const.TileMetadata.TableName,
                Item: DynamoDB.Converter.marshall(record),
            })
            .promise();
        return record.id;
    }
}

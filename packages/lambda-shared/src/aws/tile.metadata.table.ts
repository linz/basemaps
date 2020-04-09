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
        return `${prefix}_${id}`;
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

    public async getImagery(imgId: string): Promise<TileMetadataImageryRecord> {
        const existing = this.imagery.get(imgId);
        if (existing) return existing;

        const item = await this.dynamo
            .getItem({
                Key: toId(imgId),
                TableName: Const.TileMetadata.TableName,
            })
            .promise();
        if (item == null || item.Item == null) throw new Error(`Unable to find tile set: ${imgId}`);

        const res = DynamoDB.Converter.unmarshall(item.Item) as TileMetadataImageryRecord;
        this.imagery.set(imgId, res);
        return res;
    }

    public async getAllImagery(record: TileMetadataSetRecord): Promise<Map<string, TileMetadataImageryRecord>> {
        const unfetched = new Set<string>();
        const output = new Map<string, TileMetadataImageryRecord>();
        for (const r of record.imagery) {
            const existing = this.imagery.get(r.id);
            if (existing == null) unfetched.add(r.id);
            else output.set(existing.id, existing);
        }

        if (unfetched.size > 0) {
            await this.fetchImagery(unfetched, output);
        }

        return output;
    }

    /**
     * Fetch imagery from the store
     * @param keys Imagery ids (already prefixed `im_${key}`)
     * @param output Adds fetched imagery to output
     */
    private async fetchImagery(keys: Set<string>, output: Map<string, TileMetadataImageryRecord>): Promise<void> {
        let mappedKeys = Array.from(keys, toId);

        const origSize = output.size;

        while (mappedKeys.length > 0) {
            const Keys = mappedKeys.length > 100 ? mappedKeys.slice(0, 100) : mappedKeys;
            mappedKeys = mappedKeys.length > 100 ? mappedKeys.slice(100) : [];

            const items = await this.dynamo
                .batchGetItem({
                    RequestItems: {
                        [Const.TileMetadata.TableName]: { Keys },
                    },
                })
                .promise();

            const metadataItems = items.Responses?.[Const.TileMetadata.TableName];
            if (metadataItems == null) throw new Error('Failed to fetch tile metadata');

            for (const row of metadataItems) {
                const item = DynamoDB.Converter.unmarshall(row) as TileMetadataImageryRecord;
                this.imagery.set(item.id, item);
                output.set(item.id, item);
            }
        }

        if (output.size - origSize < keys.size) {
            throw new Error(
                'Missing fetched items\n' +
                    Array.from(keys.values())
                        .filter((i) => !output.has(i))
                        .join(', '),
            );
        }
    }

    public async create(record: TileMetadataRecord): Promise<string> {
        record.updatedAt = Date.now();
        await this.dynamo
            .putItem({
                TableName: Const.TileMetadata.TableName,
                Item: DynamoDB.Converter.marshall(record),
            })
            .promise();
        return record.id;
    }
}

import { EPSG } from '@basemaps/geo';
import { DynamoDB } from 'aws-sdk';
import { Const } from '../const';
import { BaseDynamoTable } from './aws.dynamo.table';
import { TileMetadataImagery } from './tile.metadata.imagery';
import { TileMetadataTileSet } from './tile.metadata.tileset';

export enum TileSetTag {
    /** Version to render by default */
    Production = 'production',

    /** Most recent version */
    Head = 'head',

    /** Pre release testing version */
    Beta = 'beta',
}

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

    /** Rendering priority, lower numbers are rendered onto the canvas first */
    priority: number;
}

export interface TileMetadataSetRecord extends BaseDynamoTable {
    /** TileSet set name */
    name: string;

    projection: EPSG.Google;

    /** first record is the first record drawn onto a tile */
    imagery: Record<string, TileMetadataImageRule>;

    /** Current version number */
    version: number;

    /** Total number of revisions */
    revisions?: number;
}

export enum RecordPrefix {
    Imagery = 'im',
    TileSet = 'ts',
}

function toId(id: string): { id: { S: string } } {
    return { id: { S: id } };
}

export class TileMetadataTable {
    dynamo: DynamoDB;

    TileSet: TileMetadataTileSet;
    Imagery: TileMetadataImagery;

    public constructor() {
        this.dynamo = new DynamoDB({});
        this.TileSet = new TileMetadataTileSet(this);
        this.Imagery = new TileMetadataImagery(this);
    }

    /**
     * Prefix a dynamoDb id with the provided prefix if it doesnt already start with it.
     */
    static prefix(prefix: RecordPrefix, id: string): string {
        if (id == '') return id;
        if (id.startsWith(prefix)) return id;
        return `${prefix}_${id}`;
    }

    /**
     * Remove the prefix from a dynamoDb id
     */
    static unprefix(prefix: RecordPrefix, id: string): string {
        if (id.startsWith(prefix)) return id.substr(3);
        return id;
    }

    public async get<T>(key: string): Promise<T | null> {
        const item = await this.dynamo
            .getItem({
                Key: toId(key),
                TableName: Const.TileMetadata.TableName,
            })
            .promise();

        if (item == null || item.Item == null) return null;
        return DynamoDB.Converter.unmarshall(item.Item) as T;
    }

    /**
     * Fetch imagery from the store
     * @param keys Imagery ids (already prefixed `im_${key}`)
     * @param output Adds fetched imagery to output
     */
    public async batchGet<T extends TileMetadataRecord>(keys: Set<string>): Promise<Map<string, T>> {
        let mappedKeys = Array.from(keys, toId);

        const output: Map<string, T> = new Map();

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
                const item = DynamoDB.Converter.unmarshall(row) as T;
                output.set(item.id, item);
            }
        }

        if (output.size < keys.size) {
            throw new Error(
                'Missing fetched items\n' +
                    Array.from(keys.values())
                        .filter((i) => !output.has(i))
                        .join(', '),
            );
        }
        return output;
    }

    async put(record: TileMetadataRecord): Promise<string> {
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

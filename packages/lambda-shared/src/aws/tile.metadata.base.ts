import { EPSG } from '@basemaps/geo';
import { DynamoDB } from 'aws-sdk';
import { Const } from '../const';
import { BaseDynamoTable } from './aws.dynamo.table';

export enum TileMetadataTag {
    /** Version to render by default */
    Production = 'production',

    /** Most recent version */
    Head = 'head',

    /** Pre release testing version */
    Beta = 'beta',
}

/**
 * Ensure `tagInput` is a valid tag otherwise return null
 */
export function parseMetadataTag(tagInput: string | null | undefined): TileMetadataTag | null {
    switch (tagInput) {
        case TileMetadataTag.Beta:
        case TileMetadataTag.Head:
        case TileMetadataTag.Production:
            return tagInput;
        default:
            return null;
    }
}

/**
 * The database format for the ApiKey Table
 */
export type TileMetadataRecord = TileMetadataImageryRecord | TaggedTileMetadataRecord;

export interface TileMetadataImageryRecord extends BaseDynamoTable {
    /** Imagery set name */
    name: string;

    projection: EPSG.Google;

    /** The location of the COGs like s3://basemaps-cogs/3857/aerial/jobId123 */
    uri: string;

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

export interface TaggedTileMetadataRecord extends BaseDynamoTable {
    /** Current version number */
    version: number;

    /** Total number of revisions */
    revisions?: number;
}

export interface TileMetadataSetRecord extends TaggedTileMetadataRecord {
    /** TileSet set name */
    name: string;

    /** Use for WMTS ows:title */
    title?: string;

    /** Use for WMTS ows:abstract */
    description?: string;

    projection: EPSG.Google;

    /** the rendering rules for imagery in this tileset */
    imagery: Record<string, TileMetadataImageRule>;

    /** Background to render for areas where there is no data */
    background?: { r: number; g: number; b: number; alpha: number };
}

/**
 * Provider details used by WMTS
 */

export interface TileMetadataProviderRecord extends TaggedTileMetadataRecord {
    serviceIdentification: {
        title: string;
        description: string;
        fees: string;
        accessConstraints: string;
    };
    serviceProvider: {
        name: string;
        site: string;
        contact: {
            individualName: string;
            position: string;
            phone: string;
            address: {
                deliveryPoint: string;
                city: string;
                postalCode: string;
                country: string;
                email: string;
            };
        };
    };
}

export interface TileSetRuleImagery {
    rule: TileMetadataImageRule;
    imagery: TileMetadataImageryRecord;
}

export enum RecordPrefix {
    Imagery = 'im',
    TileSet = 'ts',
    Provider = 'pv',
}

function toId(id: string): { id: { S: string } } {
    return { id: { S: id } };
}

export class TileMetadataTableBase {
    dynamo: DynamoDB;

    public constructor() {
        this.dynamo = new DynamoDB({});
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

export abstract class TaggedTileMetadata<T extends TaggedTileMetadataRecord> {
    metadata: TileMetadataTableBase;

    constructor(metadata: TileMetadataTableBase) {
        this.metadata = metadata;
    }

    abstract idRecord(record: T, tag: TileMetadataTag | number): string;

    clone(rec: T): T {
        return DynamoDB.Converter.unmarshall(DynamoDB.Converter.marshall(rec)) as T;
    }

    async tagRecord(record: T, tag: TileMetadataTag, version: number): Promise<T> {
        if (tag == TileMetadataTag.Head) throw new Error('Cannot overwrite head tag');
        const newVersionId = this.idRecord(record, version);
        const newVersion = await this.metadata.get<T>(newVersionId);
        if (newVersion == null) throw new Error(`Cannot find version: ${newVersionId}`);

        newVersion.id = this.idRecord(record, tag);
        await this.metadata.put(newVersion);
        return newVersion;
    }

    async create(record: T): Promise<T> {
        const id = this.idRecord(record, TileMetadataTag.Head);

        const v0 = await this.metadata.get<T>(id);
        record.revisions = (v0?.revisions ?? -1) + 1;
        record.version = record.revisions;

        // Insert the history record first
        const historyRecord = this.clone(record);
        historyRecord.id = this.idRecord(record, record.revisions);
        await this.metadata.put(historyRecord);

        if (v0 == null) {
            // Fresh new record, has no history so lets add the production tag too
            const productionRecord = this.clone(record);
            productionRecord.id = this.idRecord(record, TileMetadataTag.Production);
            await this.metadata.put(productionRecord);
        }

        // Update the head to put to the new record
        const headRecord = this.clone(record);
        headRecord.id = this.idRecord(record, TileMetadataTag.Head);
        await this.metadata.put(headRecord);

        return headRecord;
    }
}

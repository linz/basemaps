import { EpsgCode, WmtsProvider, BoundingBox } from '@basemaps/geo';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import { Const } from '../const';
import { BaseDynamoTable } from './aws.dynamo.table';
import { TileMetadataTable } from './tile.metadata';

export type TileMetadataTag = string;

export enum TileMetadataNamedTag {
    /** Version to render by default */
    Production = 'production',

    /** Most recent version */
    Head = 'head',

    /** Pre release testing version */
    Beta = 'beta',
}

export enum TileSetType {
    Raster = 'raster',
    Vector = 'vector',
}

export interface StyleId {
    tileSetName: string;
    tag: string | null;
    version: number;
}

export interface TileSetStyleRecord extends TaggedTileMetadataRecord {
    tileSetName: string;
    style: string;
}

export interface TileSetVectorRecord extends TileMetadataSetRecordBase {
    type: TileSetType.Vector;
    /**
     * The xyz urls for the layers
     */
    layers: string[];
}

/**
 * The database format for the ApiKey Table
 */
export type TileMetadataRecord = TileMetadataImageryRecord | TaggedTileMetadataRecord;

/**
 * Map of cog names to bounds
 */
export interface NamedBounds extends BoundingBox {
    name: string;
}

export interface TileMetadataImageryRecord extends BaseDynamoTable {
    /** Version of record. undefined = v0 */
    v: 1;

    /** Imagery set name */
    name: string;

    projection: EpsgCode;

    /** The location of the COGs like s3://basemaps-cogs/3857/aerial/jobId123 */
    uri: string;

    /** Year the imagery was acquired */
    year: number;

    /** Resolution of imagery in MM */
    resolution: number;
    /** the bounding box of all the COGs */
    bounds: BoundingBox;

    /** list of file basenames and their bounding box */
    files: NamedBounds[];
}

export interface TileMetadataImageRuleBase {
    /** Minimal zoom to show the layer @default 0 */
    minZoom: number;

    /** Max zoom to show the layer @default 32 */
    maxZoom: number;

    /** Rendering priority, lower numbers are rendered onto the canvas first */
    priority: number;
}
export interface TileMetadataImageRuleV1 extends TileMetadataImageRuleBase {
    /** Unique imagery id  (prefix: im_)*/
    id: string;
}

export interface TileMetadataImageRuleV2 extends TileMetadataImageRuleBase {
    /** Unique rule id  (prefix: ir_)*/
    ruleId: string;

    /** Unique imagery id  (prefix: im_)*/
    imgId: string;
}
export type TileMetadataImageRule = TileMetadataImageRuleV2;

export interface TaggedTileMetadataRecord extends BaseDynamoTable {
    /** Current version number */
    version: number;

    /** Total number of revisions */
    revisions?: number;
}

/** Background color of tiles where the tileset does not define a color */
export const DefaultBackground = { r: 0, g: 0, b: 0, alpha: 0 };

export type TileResizeKernel = 'nearest' | 'lanczos3' | 'lanczos2';
export interface TileMetadataSetRecordBase extends TaggedTileMetadataRecord {
    /** Database record version */
    v?: number;

    /** TileSet set name */
    name: string;

    /** Use for WMTS ows:title */
    title?: string;

    /** Use for WMTS ows:abstract */
    description?: string;
    projection: EpsgCode;

    /** Background to render for areas where there is no data */
    background?: { r: number; g: number; b: number; alpha: number };

    /** When scaling tiles in the rendering process what kernel to use */
    resizeKernel?: { in: TileResizeKernel; out: TileResizeKernel };
}

export interface TileMetadataSetRecordV1 extends TileMetadataSetRecordBase {
    v?: undefined;
    type?: TileSetType.Raster;

    /** the rendering rules for imagery in this tileset */
    imagery: Record<string, TileMetadataImageRuleV1>;
}

export interface TileMetadataSetRecordV2 extends TileMetadataSetRecordBase {
    v: 2;
    /** New records will have this set */
    type?: TileSetType.Raster;
    /**
     * The rendering rules for imagery in this tileset
     *
     * This array is not sorted in the rendering order
     * This should be sorted into the rendering order using
     */
    rules: TileMetadataImageRuleV2[];
}

export type TileMetadataSetRecord = TileMetadataSetRecordV2 | TileSetVectorRecord;

/**
 * Provider details used by WMTS
 */

export type TileMetadataProviderRecord = TaggedTileMetadataRecord & WmtsProvider;

export enum RecordPrefix {
    Imagery = 'im',
    TileSet = 'ts',
    Provider = 'pv',
    ImageryRule = 'ir',
    Style = 'st',
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
        if (id === '') return id;
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
     * Iterate over the entire table yielding each batch of items

     * @param TableName the name of the table to interate over
     */
    async *scan<T>(TableName: string): AsyncGenerator<T, null, void> {
        let exclusiveStartKey: DynamoDB.Key | undefined = undefined;
        while (true) {
            const items: DynamoDB.Types.ScanOutput = await this.dynamo
                .scan({
                    TableName,
                    ExclusiveStartKey: exclusiveStartKey,
                })
                .promise();

            if (items.Items == null) break;

            for (const row of items.Items) {
                yield DynamoDB.Converter.unmarshall(row) as any;
            }

            exclusiveStartKey = items.LastEvaluatedKey;
            if (exclusiveStartKey == null) break;
        }
        return null;
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
    metadata: TileMetadataTable;

    constructor(metadata: TileMetadataTable) {
        this.metadata = metadata;
    }

    abstract idRecord(record: T, tag: TileMetadataTag | number): string;

    clone(rec: T): T {
        return DynamoDB.Converter.unmarshall(DynamoDB.Converter.marshall(rec)) as T;
    }

    async tagRecord(record: T, tag: TileMetadataTag, version: number): Promise<T> {
        if (tag === TileMetadataNamedTag.Head) throw new Error('Cannot overwrite head tag');
        const newVersionId = this.idRecord(record, version);
        const newVersion = await this.metadata.get<T>(newVersionId);
        if (newVersion == null) throw new Error(`Cannot find version: ${newVersionId}`);

        newVersion.id = this.idRecord(record, tag);
        await this.metadata.put(newVersion);
        return newVersion;
    }

    async create(record: T): Promise<T> {
        const id = this.idRecord(record, TileMetadataNamedTag.Head);

        const v0 = await this.metadata.get<T>(id);
        record.revisions = (v0?.revisions ?? -1) + 1;
        record.version = record.revisions;

        // Insert the history record first
        const historyRecord = this.clone(record);
        historyRecord.id = this.idRecord(record, record.revisions);
        await this.metadata.put(historyRecord);

        // Update the head to put to the new record
        const headRecord = this.clone(record);
        headRecord.id = this.idRecord(record, TileMetadataNamedTag.Head);
        await this.metadata.put(headRecord);

        return headRecord;
    }
}

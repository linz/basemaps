import { EPSG } from '@basemaps/geo';
import { DynamoDB } from 'aws-sdk';
import { TileMetadataImageRule, TileMetadataSetRecord, TileMetadataTable, TileSetTag } from './tile.metadata';

function clone(rec: TileMetadataSetRecord): TileMetadataSetRecord {
    return DynamoDB.Converter.unmarshall(DynamoDB.Converter.marshall(rec)) as TileMetadataSetRecord;
}

/**
 * Sort rules by priority
 *
 * This sort needs to be stable, or rendering issues will occur
 *
 * @param ruleA
 * @param ruleB
 */
export function sortRule(ruleA: TileMetadataImageRule, ruleB: TileMetadataImageRule): number {
    if (ruleA.priority == ruleB.priority) {
        return ruleA.id.localeCompare(ruleB.id);
    }
    return ruleA.priority - ruleB.priority;
}

export class TileMetadataTileSet {
    metadata: TileMetadataTable;

    constructor(metadata: TileMetadataTable) {
        this.metadata = metadata;
    }

    /**
     * Parse a tile set tag combo into their parts
     *
     * @example
     * aerial@head => {name: aerial, tag: head}
     * @param str String to parse
     */
    parse(str: string): { name: string; tag?: TileSetTag } {
        if (!str.includes('@')) return { name: str };

        const [name, tagStr] = str.split('@');
        switch (tagStr) {
            case TileSetTag.Beta:
            case TileSetTag.Head:
            case TileSetTag.Production:
                break;
            default:
                return { name: str };
        }
        return { name, tag: tagStr };
    }

    id(name: string, projection: EPSG, tag: TileSetTag | number): string {
        if (typeof tag == 'number') {
            const versionKey = `${tag}`.padStart(6, '0');
            return `ts_${name}_${projection}_v${versionKey}`;
        }

        return `ts_${name}_${projection}_${tag}`;
    }

    async get(name: string, projection: EPSG, version: number): Promise<TileMetadataSetRecord>;
    async get(name: string, projection: EPSG, tag: TileSetTag): Promise<TileMetadataSetRecord>;
    async get(
        name: string,
        projection: EPSG,
        tagOrVersion: TileSetTag | number,
    ): Promise<TileMetadataSetRecord | null> {
        const id = this.id(name, projection, tagOrVersion);
        return await this.metadata.get<TileMetadataSetRecord>(id);
    }

    async tag(name: string, projection: EPSG, tag: TileSetTag, version: number): Promise<TileMetadataSetRecord> {
        if (tag == TileSetTag.Head) throw new Error('Cannot overwrite head tag');
        const newVersionId = this.id(name, projection, version);
        const newVersion = await this.metadata.get<TileMetadataSetRecord>(newVersionId);
        if (newVersion == null) throw new Error(`Cannot find version: ${newVersionId}`);

        newVersion.id = this.id(name, projection, tag);
        await this.metadata.put(newVersion);
        return newVersion;
    }

    async create(record: TileMetadataSetRecord): Promise<TileMetadataSetRecord> {
        const id = this.id(record.name, record.projection, TileSetTag.Head);

        const v0 = await this.metadata.get<TileMetadataSetRecord>(id);
        record.revisions = (v0?.revisions ?? -1) + 1;
        record.version = record.revisions;

        // Insert the history record first
        const historyRecord = clone(record);
        historyRecord.id = this.id(record.name, record.projection, record.revisions);
        await this.metadata.put(historyRecord);

        if (v0 == null) {
            // Fresh new record, has no history so lets add the production tag too
            const productionRecord = clone(record);
            productionRecord.id = this.id(record.name, record.projection, TileSetTag.Production);
            await this.metadata.put(productionRecord);
        }

        // Update the head to put to the new record
        const headRecord = clone(record);
        headRecord.id = this.id(record.name, record.projection, TileSetTag.Head);
        await this.metadata.put(headRecord);

        return headRecord;
    }
}

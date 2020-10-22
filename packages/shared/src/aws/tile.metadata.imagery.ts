import { BaseDynamoTable } from './aws.dynamo.table';
import {
    RecordPrefix,
    TileMetadataImageryRecord,
    TileMetadataSetRecord,
    TileMetadataTableBase,
} from './tile.metadata.base';

/**
 * Imagery sort must be stable, otherwise the ordering of imagery sets will vary between tile
 * renders, causing weird artifacts in the map
 */
export function compareImageSets(ai: TileMetadataImageryRecord, bi: TileMetadataImageryRecord): number {
    // Sort by year, newest on top
    if (ai.year != bi.year) {
        return ai.year - bi.year;
    }

    // Resolution, highest resolution (lowest number) on top
    if (ai.resolution != bi.resolution) {
        return bi.resolution - ai.resolution;
    }

    // If everything is equal use the name to force a stable sort
    return ai.id.localeCompare(bi.id);
}

export class TileMetadataImagery {
    imagery = new Map<string, TileMetadataImageryRecord>();

    metadata: TileMetadataTableBase;
    constructor(metadata: TileMetadataTableBase) {
        this.metadata = metadata;
    }

    /**
     * Is `rec` an Imagery record

     * @param rec record to infer is a TileMetadataImageryRecord
     */
    public recordIsImagery(rec: BaseDynamoTable): rec is TileMetadataImageryRecord {
        return rec.id.startsWith(RecordPrefix.Imagery);
    }

    public async get(imgId: string): Promise<TileMetadataImageryRecord> {
        const existing = this.imagery.get(imgId);
        if (existing) return existing;

        const item = await this.metadata.get<TileMetadataImageryRecord>(imgId);
        if (item == null) throw new Error('Unable to find imagery: ' + imgId);
        if (item.v == null) throw new Error('version 0 imagery no longer supported');
        this.imagery.set(imgId, item);
        return item;
    }

    /**
     * Get all the associated imagery for a tile set
     * @param record tileset record to fetch imagery for
     */
    public async getAll(record: TileMetadataSetRecord): Promise<Map<string, TileMetadataImageryRecord>> {
        const toFetch = new Set<string>();
        const output = new Map<string, TileMetadataImageryRecord>();
        for (const rule of record.rules) {
            const imagery = this.imagery.get(rule.imgId);
            if (imagery == null) {
                toFetch.add(rule.imgId);
            } else {
                output.set(rule.imgId, imagery);
            }
        }

        if (toFetch.size > 0) {
            const records = await this.metadata.batchGet<TileMetadataImageryRecord>(toFetch);
            for (const imagery of records.values()) {
                if (imagery.v == null) throw new Error('version 0 imagery no longer supported');
                this.imagery.set(imagery.id, imagery);
                output.set(imagery.id, imagery);
            }
        }
        return output;
    }
}

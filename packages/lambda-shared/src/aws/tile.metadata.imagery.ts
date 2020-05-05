import { TileMetadataTable, TileMetadataImageryRecord, TileMetadataSetRecord } from './tile.metadata';

export class TileMetadataImagery {
    imagery = new Map<string, TileMetadataImageryRecord>();

    metadata: TileMetadataTable;
    constructor(metadata: TileMetadataTable) {
        this.metadata = metadata;
    }

    public async get(imgId: string): Promise<TileMetadataImageryRecord> {
        const existing = this.imagery.get(imgId);
        if (existing) return existing;

        const item = await this.metadata.get<TileMetadataImageryRecord>(imgId);
        if (item == null) throw new Error('Unable to find imagery: ' + imgId);
        this.imagery.set(imgId, item);
        return item;
    }

    public async getAll(record: TileMetadataSetRecord): Promise<Map<string, TileMetadataImageryRecord>> {
        const toFetch = new Set<string>();
        const output = new Map<string, TileMetadataImageryRecord>();
        for (const ruleId of Object.keys(record.imagery)) {
            const existing = this.imagery.get(ruleId);
            if (existing == null) {
                toFetch.add(ruleId);
            } else {
                output.set(existing.id, existing);
            }
        }

        if (toFetch.size > 0) {
            const records = await this.metadata.batchGet<TileMetadataImageryRecord>(toFetch);
            for (const rec of records.values()) {
                this.imagery.set(rec.id, rec);
                output.set(rec.id, rec);
            }
        }

        return output;
    }
}

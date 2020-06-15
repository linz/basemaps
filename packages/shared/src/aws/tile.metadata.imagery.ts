import {
    TileMetadataImageryRecordV1,
    TileMetadataSetRecord,
    TileMetadataTableBase,
    TileSetRuleImagery,
} from './tile.metadata.base';

/**
 * Imagery sort must be stable, otherwise the ordering of imagery sets will vary between tile
 * renders, causing werid artifacts in the map
 */
export function compareImageSets(a: TileSetRuleImagery, b: TileSetRuleImagery): number {
    // Sort by priority, highest on top
    if (a.rule.priority != b.rule.priority) {
        return a.rule.priority - b.rule.priority;
    }

    const ai = a.imagery;
    const bi = b.imagery;

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
    imagery = new Map<string, TileMetadataImageryRecordV1>();

    metadata: TileMetadataTableBase;
    constructor(metadata: TileMetadataTableBase) {
        this.metadata = metadata;
    }

    public async get(imgId: string): Promise<TileMetadataImageryRecordV1> {
        const existing = this.imagery.get(imgId);
        if (existing) return existing;

        const item = await this.metadata.get<TileMetadataImageryRecordV1>(imgId);
        if (item == null) throw new Error('Unable to find imagery: ' + imgId);
        if (item.v == null) throw new Error('version 0 imagery no longer suppored');
        this.imagery.set(imgId, item);
        return item;
    }

    public async getAll(record: TileMetadataSetRecord): Promise<TileSetRuleImagery[]> {
        const toFetch = new Set<string>();
        const output: TileSetRuleImagery[] = [];
        const rules = record.imagery;
        for (const ruleId in rules) {
            const rule = rules[ruleId];
            const imagery = this.imagery.get(ruleId);
            if (imagery == null) {
                toFetch.add(ruleId);
            } else {
                output.push({ rule, imagery });
            }
        }

        if (toFetch.size > 0) {
            const records = await this.metadata.batchGet<TileMetadataImageryRecordV1>(toFetch);
            for (const imagery of records.values()) {
                if (imagery.v == null) throw new Error('version 0 imagery no longer suppored');
                this.imagery.set(imagery.id, imagery);
                output.push({ rule: rules[imagery.id], imagery });
            }
        }

        return output.sort(compareImageSets);
    }
}

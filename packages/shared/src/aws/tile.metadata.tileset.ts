import { Epsg } from '@basemaps/geo';
import {
    TaggedTileMetadata,
    TileMetadataImageRule,
    TileMetadataSetRecord,
    TileMetadataTag,
    parseMetadataTag,
} from './tile.metadata.base';

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

export class TileMetadataTileSet extends TaggedTileMetadata<TileMetadataSetRecord> {
    /**
     * Parse a tile set tag combo into their parts
     *
     * @example
     * aerial@head => {name: aerial, tag: head}
     * @param str String to parse
     */
    parse(str: string): { name: string; tag?: TileMetadataTag } {
        if (!str.includes('@')) return { name: str };

        const [name, tagStr] = str.split('@');
        const tag = parseMetadataTag(tagStr);
        if (tag == null) return { name: str };
        return { name, tag };
    }

    idRecord(record: TileMetadataSetRecord, tag: TileMetadataTag | number): string {
        if (typeof tag == 'number') {
            const versionKey = `${tag}`.padStart(6, '0');
            return `ts_${record.name}_${record.projection}_v${versionKey}`;
        }

        return `ts_${record.name}_${record.projection}_${tag}`;
    }

    id(name: string, projection: Epsg, tag: TileMetadataTag | number): string {
        return this.idRecord({ name, projection: projection.code } as TileMetadataSetRecord, tag);
    }

    async get(name: string, projection: Epsg, version: number): Promise<TileMetadataSetRecord>;
    async get(name: string, projection: Epsg, tag: TileMetadataTag): Promise<TileMetadataSetRecord>;
    async get(
        name: string,
        projection: Epsg,
        tagOrVersion: TileMetadataTag | number,
    ): Promise<TileMetadataSetRecord | null> {
        const id = this.id(name, projection, tagOrVersion);
        return await this.metadata.get(id);
    }

    async tag(name: string, projection: Epsg, tag: TileMetadataTag, version: number): Promise<TileMetadataSetRecord> {
        return super.tagRecord({ name, projection: projection.code } as TileMetadataSetRecord, tag, version);
    }
}

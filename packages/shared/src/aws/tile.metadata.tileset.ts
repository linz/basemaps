import { Epsg } from '@basemaps/geo';
import {
    parseMetadataTag,
    RecordPrefix,
    TaggedTileMetadata,
    TileMetadataImageryRecord,
    TileMetadataSetRecord,
    TileMetadataSetRecordBase,
    TileMetadataSetRecordV1,
    TileMetadataTableBase,
    TileMetadataTag,
} from './tile.metadata.base';
import { compareImageSets } from './tile.metadata.imagery';

function isLatestTileSetRecord(record: TileMetadataSetRecordBase): record is TileMetadataSetRecord {
    return record.v === 2;
}

export class TileMetadataTileSet extends TaggedTileMetadata<TileMetadataSetRecord> {
    /**
     * Take a older imagery record and upgrade it to the latest record version
     * @param record
     */
    migrate(record: TileMetadataSetRecordV1): TileMetadataSetRecord {
        // V1 -> V2
        const output: TileMetadataSetRecord = record as any;
        const imagery = record.imagery;
        delete (record as any).imagery;

        output.rules = [];
        output.v = 2;
        // Some testing data does not have a imagery object
        if (imagery == null) return output;

        for (const image of Object.values(imagery)) {
            // Imagery rules are unique in older tile sets so just use them as a ruleId to start with
            const ruleId = TileMetadataTableBase.unprefix(RecordPrefix.Imagery, image.id);
            output.rules.push({
                ruleId: TileMetadataTableBase.prefix(RecordPrefix.ImageryRule, ruleId),
                imgId: image.id,
                minZoom: image.minZoom,
                maxZoom: image.maxZoom,
                priority: image.priority,
            });
        }
        return output;
    }

    /**
     * Sort the render rules of a tile set given the information about the imagery
     *
     * This sorts the `tileSet.rules` array to be in the order of first is the highest priority imagery to layer
     *
     * @param tileSet with rules that need to be sorted
     * @param imagery All imagery referenced inside the tileset
     */
    sortRenderRules(tileSet: TileMetadataSetRecord, imagery: Map<string, TileMetadataImageryRecord>): void {
        tileSet.rules.sort((ruleA, ruleB) => {
            if (ruleA.priority != ruleB.priority) return ruleA.priority - ruleB.priority;
            const imgA = imagery.get(ruleA.imgId);
            const imgB = imagery.get(ruleB.imgId);
            if (imgA == null || imgB == null) throw new Error('Unable to find imagery to sort');

            return compareImageSets(imgA, imgB);
        });
    }

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

    async create(record: TileMetadataSetRecord | TileMetadataSetRecordV1): Promise<TileMetadataSetRecord> {
        if (isLatestTileSetRecord(record)) return super.create(record);
        return super.create(this.migrate(record));
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
        const record = (await this.metadata.get(id)) as TileMetadataSetRecord;
        if (record == null) return null;

        if (isLatestTileSetRecord(record)) return record;
        return this.migrate(record);
    }

    public async batchGet(keys: Set<string>): Promise<Map<string, TileMetadataSetRecord>> {
        const objects = await this.metadata.batchGet<TileMetadataSetRecordV1 | TileMetadataSetRecord>(keys);
        const output = new Map<string, TileMetadataSetRecord>();

        for (const record of objects.values()) {
            if (isLatestTileSetRecord(record)) {
                output.set(record.id, record);
            } else {
                output.set(record.id, this.migrate(record));
            }
        }
        return output;
    }

    async tag(name: string, projection: Epsg, tag: TileMetadataTag, version: number): Promise<TileMetadataSetRecord> {
        const record = await super.tagRecord(
            { name, projection: projection.code } as TileMetadataSetRecord,
            tag,
            version,
        );

        if (isLatestTileSetRecord(record)) return record;
        return this.migrate(record);
    }
}

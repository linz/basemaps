import { Epsg, EpsgCode } from '@basemaps/geo';
import { BaseDynamoTable } from './aws.dynamo.table';
import {
    DefaultBackground,
    parseMetadataTag,
    RecordPrefix,
    TaggedTileMetadata,
    TileMetadataImageRuleV2,
    TileMetadataImageryRecord,
    TileMetadataSetRecord,
    TileMetadataSetRecordBase,
    TileMetadataSetRecordV1,
    TileMetadataSetRecordV2,
    TileMetadataTableBase,
    TileMetadataTag,
    TileSetId,
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
    migrate(record: TileMetadataSetRecordV1 | TileMetadataSetRecordV2): TileMetadataSetRecord {
        if (isLatestTileSetRecord(record)) return record;

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

    initialRecord(
        name: string,
        projection: EpsgCode,
        rules: TileMetadataImageRuleV2[] = [],
        title?: string,
        description?: string,
    ): TileMetadataSetRecord {
        const rec: TileMetadataSetRecord = {
            id: '',
            createdAt: Date.now(),
            updatedAt: 0,
            version: 0,
            revisions: 0,
            v: 2,
            name,
            projection: projection,
            background: DefaultBackground,
            rules,
        };

        if (title != null) {
            rec.title = title;
        }
        if (description != null) {
            rec.description = description;
        }

        return rec;
    }

    /**
     * Is `rec` a TileSet record

     * @param rec record to infer is a TileMetadataSetRecord
     */
    recordIsTileSet(rec: BaseDynamoTable): rec is TileMetadataSetRecordV1 | TileMetadataSetRecordV2 {
        return rec.id.startsWith(RecordPrefix.TileSet);
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
            if (ruleA.priority !== ruleB.priority) return ruleA.priority - ruleB.priority;
            const imgA = imagery.get(ruleA.imgId);
            const imgB = imagery.get(ruleB.imgId);
            if (imgA == null || imgB == null) throw new Error('Unable to find imagery to sort');

            return compareImageSets(imgA, imgB);
        });
    }

    async create(record: TileMetadataSetRecord | TileMetadataSetRecordV1): Promise<TileMetadataSetRecord> {
        if (isLatestTileSetRecord(record)) return super.create(record);
        return super.create(this.migrate(record));
    }

    idRecord(record: TileMetadataSetRecord, tag: TileMetadataTag | number): string {
        if (typeof tag === 'number') {
            const versionKey = `${tag}`.padStart(6, '0');
            return `ts_${record.name}_${record.projection}_v${versionKey}`;
        }

        return `ts_${record.name}_${record.projection}_${tag}`;
    }

    idSplit(record: TileMetadataSetRecord): TileSetId | null {
        const [prefix, name, projectionCode, tag] = record.id.split('_');
        const version = record.version;

        if (prefix !== 'ts') return null;

        const projection = Epsg.parse(projectionCode);
        if (projection == null) return null;

        if (parseMetadataTag(tag)) return { name, projection, tag, version };

        if (tag.startsWith('v')) {
            const idVersion = parseInt(tag.substring(1), 10);
            if (idVersion === version) return { name, projection, tag, version };
        }

        return null;
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

    /**
     * Iterate over all records in the TileMetadataTable
     */
    async *[Symbol.asyncIterator](): AsyncGenerator<TileMetadataSetRecord, null, void> {
        for await (const record of this.metadata) {
            if (!this.recordIsTileSet(record)) continue;
            if (isLatestTileSetRecord(record)) {
                yield record;
            } else {
                yield this.migrate(record);
            }
        }
        return null;
    }
}

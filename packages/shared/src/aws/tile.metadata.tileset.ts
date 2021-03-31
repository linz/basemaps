import { Epsg, EpsgCode } from '@basemaps/geo';
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
    TileSetRecord,
    TileSetType,
    TileSetVectorRecord,
} from './tile.metadata.base';
import { compareImageSets } from './tile.metadata.imagery';

export class TileMetadataTileSet extends TaggedTileMetadata<TileSetRecord> {
    isLatestTileSetRecord(record: TileMetadataSetRecordBase): record is TileMetadataSetRecord {
        return record.type === TileSetType.Aerial && record.v === 2;
    }

    isVectorTileSetRecord(record: TileMetadataSetRecordBase): record is TileSetVectorRecord {
        return record.type === TileSetType.Vector;
    }

    /**
     * Take a older imagery record and upgrade it to the latest record version
     * @param record
     */
    migrate(record: TileMetadataSetRecordV1 | TileMetadataSetRecordV2): TileMetadataSetRecord {
        if (this.isLatestTileSetRecord(record)) return record;

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
        type: string,
        rules?: TileMetadataImageRuleV2[],
        layers?: string[],
        title?: string,
        description?: string,
    ): TileSetRecord {
        const rec: TileMetadataSetRecordBase = {
            id: '',
            createdAt: Date.now(),
            updatedAt: 0,
            version: 0,
            revisions: 0,
            name,
            projection: projection,
        };

        if (title != null) {
            rec.title = title;
        }
        if (description != null) {
            rec.description = description;
        }

        if (type === TileSetType.Vector) {
            // Initial TileMetadataSetRecord
            const tileSetRecord: TileSetVectorRecord = {
                ...rec,
                type: TileSetType.Vector,
                layers: layers != null ? layers : [],
            };
            return tileSetRecord;
        } else {
            // Initial TileMetadataSetRecord
            const tileSetRecord: TileMetadataSetRecord = {
                ...rec,
                v: 2,
                background: DefaultBackground,
                rules: rules != null ? rules : [],
            };
            return tileSetRecord;
        }
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

    async create(record: TileSetRecord | TileMetadataSetRecordV1): Promise<TileSetRecord> {
        if (isVectorTileSetRecord(record)) return super.create(record);
        if (isLatestTileSetRecord(record)) return super.create(record);
        return super.create(this.migrate(record));
    }

    idRecord(record: TileSetRecord, tag: TileMetadataTag | number): string {
        if (typeof tag === 'number') {
            const versionKey = `${tag}`.padStart(6, '0');
            return `${RecordPrefix.TileSet}_${record.name}_${record.projection}_v${versionKey}`;
        }

        return `${RecordPrefix.TileSet}_${record.name}_${record.projection}_${tag}`;
    }

    idSplit(record: TileSetRecord): TileSetId | null {
        const [prefix, name, projectionCode, tag] = record.id.split('_');
        const version = record.version;

        if (prefix !== RecordPrefix.TileSet) return null;

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
        return this.idRecord({ name, projection: projection.code } as TileSetRecord, tag);
    }

    async get(name: string, projection: Epsg, version: number): Promise<TileSetRecord>;
    async get(name: string, projection: Epsg, tag: TileMetadataTag): Promise<TileSetRecord>;
    async get(name: string, projection: Epsg, tagOrVersion: TileMetadataTag | number): Promise<TileSetRecord | null> {
        const id = this.id(name, projection, tagOrVersion);
        const record = (await this.metadata.get(id)) as TileSetRecord;
        if (record == null) return null;
        if (isVectorTileSetRecord(record)) return record;
        if (isLatestTileSetRecord(record)) return record;
        return this.migrate(record);
    }

    public async batchGet(keys: Set<string>): Promise<Map<string, TileSetRecord>> {
        const objects = await this.metadata.batchGet<TileMetadataSetRecordV1 | TileSetRecord>(keys);
        const output = new Map<string, TileSetRecord>();

        for (const record of objects.values()) {
            if (isLatestTileSetRecord(record)) {
                output.set(record.id, record);
            } else if (isVectorTileSetRecord(record)) {
                output.set(record.id, record);
            } else {
                output.set(record.id, this.migrate(record));
            }
        }
        return output;
    }

    async tag(name: string, projection: Epsg, tag: TileMetadataTag, version: number): Promise<TileSetRecord> {
        const record = await super.tagRecord({ name, projection: projection.code } as TileSetRecord, tag, version);
        if (isVectorTileSetRecord(record)) return record;
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
                yield this.migrate(record as TileMetadataSetRecordV1);
            }
        }
        return null;
    }
}

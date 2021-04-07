import { Epsg, EpsgCode } from '@basemaps/geo';
import { TileSetNameParser } from '../tile.set.name';
import { BaseDynamoTable } from './aws.dynamo.table';
import {
    DefaultBackground,
    RecordPrefix,
    TaggedTileMetadata,
    TileMetadataImageRule,
    TileMetadataImageryRecord,
    TileMetadataSetRecord,
    TileSetRasterRecord,
    TileSetVectorRecord,
    TileMetadataTag,
    TileSetType,
} from './tile.metadata.base';
import { compareImageSets } from './tile.metadata.imagery';

export interface TileSetId {
    name: string;
    projection: Epsg;
    tag: string | null;
    version: number;
}

export class TileMetadataTileSet extends TaggedTileMetadata<TileMetadataSetRecord> {
    isVectorRecord(x: TileMetadataSetRecord): x is TileSetVectorRecord {
        return x.type === TileSetType.Vector;
    }

    isRasterRecord(x: TileMetadataSetRecord): x is TileSetRasterRecord {
        return x.type == null || x.type === TileSetType.Raster;
    }

    initialRecordRaster(
        name: string,
        projection: EpsgCode,
        rules: TileMetadataImageRule[] = [],
        title?: string,
        description?: string,
    ): TileSetRasterRecord {
        const rec: TileSetRasterRecord = {
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

        if (title != null) rec.title = title;
        if (description != null) rec.description = description;

        return rec;
    }
    /**
     * Sort the render rules of a tile set given the information about the imagery
     *
     * This sorts the `tileSet.rules` array to be in the order of first is the highest priority imagery to layer
     *
     * @param tileSet with rules that need to be sorted
     * @param imagery All imagery referenced inside the tileset
     */
    sortRenderRules(tileSet: TileSetRasterRecord, imagery: Map<string, TileMetadataImageryRecord>): void {
        tileSet.rules.sort((ruleA, ruleB) => {
            if (ruleA.priority !== ruleB.priority) return ruleA.priority - ruleB.priority;
            const imgA = imagery.get(ruleA.imgId);
            const imgB = imagery.get(ruleB.imgId);
            if (imgA == null || imgB == null) throw new Error('Unable to find imagery to sort');

            return compareImageSets(imgA, imgB);
        });
    }
    /**
     * Is `rec` a TileSet record

     * @param rec record to infer is a TileMetadataSetRecord
     */
    recordIsTileSet(rec: BaseDynamoTable): rec is TileSetRasterRecord {
        return rec.id.startsWith(RecordPrefix.TileSet);
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

        if (TileSetNameParser.parseTag(tag)) return { name, projection, tag, version };

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

        return record;
    }

    public async batchGet(keys: Set<string>): Promise<Map<string, TileMetadataSetRecord>> {
        const objects = await this.metadata.batchGet<TileMetadataSetRecord>(keys);
        const output = new Map<string, TileMetadataSetRecord>();

        for (const record of objects.values()) {
            output.set(record.id, record);
        }
        return output;
    }

    async tag(name: string, projection: Epsg, tag: TileMetadataTag, version: number): Promise<TileMetadataSetRecord> {
        const record = await super.tagRecord(
            { name, projection: projection.code } as TileMetadataSetRecord,
            tag,
            version,
        );

        return record;
    }

    /**
     * Iterate over all records in the TileMetadataTable
     */
    async *[Symbol.asyncIterator](): AsyncGenerator<TileMetadataSetRecord, null, void> {
        for await (const record of this.metadata) {
            if (!this.recordIsTileSet(record)) continue;
            yield record;
        }
        return null;
    }
}

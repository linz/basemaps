import { Epsg, EpsgCode } from '@basemaps/geo';
import {
    parseMetadataTag,
    RecordPrefix,
    TaggedTileMetadata,
    TileSetVectorRecord,
    TileMetadataTag,
    TileSetId,
} from './tile.metadata.base';

export class TileMetadataVector extends TaggedTileMetadata<TileSetVectorRecord> {
    initialRecord(
        name: string,
        projection: EpsgCode,
        layers: string[] = [],
        title?: string,
        description?: string,
    ): TileSetVectorRecord {
        const rec: TileSetVectorRecord = {
            id: '',
            createdAt: Date.now(),
            updatedAt: 0,
            version: 0,
            name,
            projection: projection,
            layers,
        };

        if (title != null) {
            rec.title = title;
        }
        if (description != null) {
            rec.description = description;
        }

        return rec;
    }

    async create(record: TileSetVectorRecord): Promise<TileSetVectorRecord> {
        return super.create(record);
    }

    idRecord(record: TileSetVectorRecord, tag: TileMetadataTag | number): string {
        if (typeof tag === 'number') {
            const versionKey = `${tag}`.padStart(6, '0');
            return `${RecordPrefix.TileSet}_${record.name}_${record.projection}_v${versionKey}`;
        }

        return `${RecordPrefix.TileSet}_${record.name}_${record.projection}_${tag}`;
    }

    idSplit(record: TileSetVectorRecord): TileSetId | null {
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
        return this.idRecord({ name, projection: projection.code } as TileSetVectorRecord, tag);
    }

    async get(name: string, projection: Epsg, version: number): Promise<TileSetVectorRecord>;
    async get(name: string, projection: Epsg, tag: TileMetadataTag): Promise<TileSetVectorRecord>;
    async get(
        name: string,
        projection: Epsg,
        tagOrVersion: TileMetadataTag | number,
    ): Promise<TileSetVectorRecord | null> {
        const id = this.id(name, projection, tagOrVersion);
        const record = (await this.metadata.get(id)) as TileSetVectorRecord;
        if (record == null) return null;
        return record;
    }

    public async batchGet(keys: Set<string>): Promise<Map<string, TileSetVectorRecord>> {
        return await this.metadata.batchGet<TileSetVectorRecord>(keys);
    }

    async tag(name: string, projection: Epsg, tag: TileMetadataTag, version: number): Promise<TileSetVectorRecord> {
        const record = await super.tagRecord(
            { name, projection: projection.code } as TileSetVectorRecord,
            tag,
            version,
        );

        return record;
    }

    /**
     * Iterate over all records in the TileMetadataTable
     */
    async *[Symbol.asyncIterator](): AsyncGenerator<TileSetVectorRecord, null, void> {
        for await (const record of this.metadata) {
            if (!this.recordIsTileSet(record)) continue;
            yield record as TileSetVectorRecord;
        }
        return null;
    }
}

import { Epsg, EpsgCode } from '@basemaps/geo';
import { BaseDynamoTable } from './aws.dynamo.table';
import {
    parseMetadataTag,
    RecordPrefix,
    TaggedTileMetadata,
    TileMetadataSetRecordVector,
    TileMetadataTag,
    TileSetId,
} from './tile.metadata.base';

export class TileMetadataVector extends TaggedTileMetadata<TileMetadataSetRecordVector> {
    initialRecord(
        name: string,
        projection: EpsgCode,
        layers: string[] = [],
        style: string,
        title?: string,
        description?: string,
    ): TileMetadataSetRecordVector {
        const rec: TileMetadataSetRecordVector = {
            id: '',
            createdAt: Date.now(),
            updatedAt: 0,
            version: 0,
            name,
            projection: projection,
            layers,
            style,
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
     * Is `rec` a Vector record

     * @param rec record to infer is a TileMetadataSetRecordVector
     */
    recordIsVector(rec: BaseDynamoTable): rec is TileMetadataSetRecordVector {
        return rec.id.startsWith(RecordPrefix.Vector);
    }

    async create(record: TileMetadataSetRecordVector): Promise<TileMetadataSetRecordVector> {
        return super.create(record);
    }

    idRecord(record: TileMetadataSetRecordVector, tag: TileMetadataTag | number): string {
        if (typeof tag === 'number') {
            const versionKey = `${tag}`.padStart(6, '0');
            return `vt_${record.name}_${record.projection}_v${versionKey}`;
        }

        return `vt_${record.name}_${record.projection}_${tag}`;
    }

    idSplit(record: TileMetadataSetRecordVector): TileSetId | null {
        const [prefix, name, projectionCode, tag] = record.id.split('_');
        const version = record.version;

        if (prefix !== 'vt') return null;

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
        return this.idRecord({ name, projection: projection.code } as TileMetadataSetRecordVector, tag);
    }

    async get(name: string, projection: Epsg, version: number): Promise<TileMetadataSetRecordVector>;
    async get(name: string, projection: Epsg, tag: TileMetadataTag): Promise<TileMetadataSetRecordVector>;
    async get(
        name: string,
        projection: Epsg,
        tagOrVersion: TileMetadataTag | number,
    ): Promise<TileMetadataSetRecordVector | null> {
        const id = this.id(name, projection, tagOrVersion);
        const record = (await this.metadata.get(id)) as TileMetadataSetRecordVector;
        if (record == null) return null;
        return record;
    }

    public async batchGet(keys: Set<string>): Promise<Map<string, TileMetadataSetRecordVector>> {
        return await this.metadata.batchGet<TileMetadataSetRecordVector>(keys);
    }

    async tag(
        name: string,
        projection: Epsg,
        tag: TileMetadataTag,
        version: number,
    ): Promise<TileMetadataSetRecordVector> {
        const record = await super.tagRecord(
            { name, projection: projection.code } as TileMetadataSetRecordVector,
            tag,
            version,
        );

        return record;
    }

    /**
     * Iterate over all records in the TileMetadataTable
     */
    async *[Symbol.asyncIterator](): AsyncGenerator<TileMetadataSetRecordVector, null, void> {
        for await (const record of this.metadata) {
            if (!this.recordIsVector(record)) continue;
            yield record;
        }
        return null;
    }
}

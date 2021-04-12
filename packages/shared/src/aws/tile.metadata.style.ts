// import { BaseDynamoTable } from './aws.dynamo.table';
// import { RecordPrefix, TaggedTileMetadata, TileMetadataTag, TileSetStyleRecord } from './tile.metadata.base';

// export interface StyleId {
//     tileSetName: string;
//     tag: string | null;
//     version: number;
// }

// export class TileMetadataStyle extends TaggedTileMetadata<TileSetStyleRecord> {
//     initialRecord(tileSetName: string, style: string): TileSetStyleRecord {
//         const rec: TileSetStyleRecord = {
//             id: '',
//             createdAt: Date.now(),
//             updatedAt: 0,
//             version: 0,
//             tileSetName,
//             style,
//         };

//         return rec;
//     }

//     recordIsStyle(rec: BaseDynamoTable): rec is TileSetStyleRecord {
//         return rec.id.startsWith(RecordPrefix.Style);
//     }

//     idRecord(record: TileSetStyleRecord, tag: TileMetadataTag | number): string {
//         if (typeof tag === 'number') {
//             const versionKey = `${tag}`.padStart(6, '0');
//             return `${RecordPrefix.Style}_${record.tileSetName}_v${versionKey}`;
//         }

//         return `${RecordPrefix.Style}_${record.tileSetName}_${tag}`;
//     }

//     id(tileSetName: string, tag: TileMetadataTag | number): string {
//         return this.idRecord({ tileSetName } as TileSetStyleRecord, tag);
//     }

//     async get(tileSetName: string, version: number): Promise<TileSetStyleRecord>;
//     async get(tileSetName: string, tag: TileMetadataTag): Promise<TileSetStyleRecord>;
//     async get(tileSetName: string, tagOrVersion: TileMetadataTag | number): Promise<TileSetStyleRecord | null> {
//         const id = this.id(tileSetName, tagOrVersion);
//         const record = (await this.metadata.get(id)) as TileSetStyleRecord;
//         if (record == null) return null;
//         return record;
//     }

//     public async batchGet(keys: Set<string>): Promise<Map<string, TileSetStyleRecord>> {
//         return await this.metadata.batchGet<TileSetStyleRecord>(keys);
//     }

//     async tag(tileSetName: string, tag: TileMetadataTag, version: number): Promise<TileSetStyleRecord> {
//         return await super.tagRecord({ tileSetName } as TileSetStyleRecord, tag, version);
//     }

//     /**
//      * Iterate over all records in the TileMetadataTable
//      */
//     async *[Symbol.asyncIterator](): AsyncGenerator<TileSetStyleRecord, null, void> {
//         for await (const record of this.metadata) {
//             if (!this.recordIsStyle(record)) continue;
//             yield record as TileSetStyleRecord;
//         }
//         return null;
//     }
// }

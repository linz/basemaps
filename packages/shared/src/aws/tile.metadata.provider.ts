// import { TaggedTileMetadata, TileMetadataProviderRecord, TileMetadataTag } from './tile.metadata.base';

// export class TileMetadataProvider extends TaggedTileMetadata<TileMetadataProviderRecord> {
//     idRecord(_record: TileMetadataProviderRecord, tag: TileMetadataTag | number): string {
//         if (typeof tag === 'number') {
//             const versionKey = `${tag}`.padStart(6, '0');
//             return `pv_main_v${versionKey}`;
//         }

//         return `pv_main_${tag}`;
//     }

//     id(tag: TileMetadataTag | number): string {
//         return this.idRecord({} as TileMetadataProviderRecord, tag);
//     }

//     async get(version: number): Promise<TileMetadataProviderRecord>;
//     async get(tag: TileMetadataTag): Promise<TileMetadataProviderRecord>;
//     async get(tagOrVersion: TileMetadataTag | number): Promise<TileMetadataProviderRecord | null> {
//         const id = this.id(tagOrVersion);
//         return await this.metadata.get<TileMetadataProviderRecord>(id);
//     }

//     async tag(tag: TileMetadataTag, version: number): Promise<TileMetadataProviderRecord> {
//         return super.tagRecord({} as TileMetadataProviderRecord, tag, version);
//     }
// }

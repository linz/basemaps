// import { Const } from '../const';
// import { TileMetadataRecord, TileMetadataTableBase } from './tile.metadata.base';
// // import { TileMetadataImagery } from './tile.metadata.imagery';
// import { TileMetadataProvider } from './tile.metadata.provider';
// import { TileMetadataStyle } from './tile.metadata.style';
// import { TileMetadataTileSet } from './tile.metadata.tileset';

// export class TileMetadataTable extends TileMetadataTableBase {
//     // TileSet: TileMetadataTileSet;
//     // Imagery: TileMetadataImagery;
//     Provider: TileMetadataProvider;
//     // Style: TileMetadataStyle;

//     public constructor() {
//         super();
//         // this.TileSet = new TileMetadataTileSet(this);
//         // this.Imagery = new TileMetadataImagery(this);
//         this.Provider = new TileMetadataProvider(this);
//         // this.Style = new TileMetadataStyle(this);
//     }

//     /**
//      * Iterate over all records in the TileMetadataTable
//      */
//     async *[Symbol.asyncIterator](): AsyncGenerator<TileMetadataRecord, null, void> {
//         yield* this.scan(Const.TileMetadata.TableName);
//         return null;
//     }
// }

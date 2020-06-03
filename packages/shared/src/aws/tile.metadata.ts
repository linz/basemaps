import { TileMetadataTableBase } from './tile.metadata.base';
import { TileMetadataImagery } from './tile.metadata.imagery';
import { TileMetadataTileSet } from './tile.metadata.tileset';
import { TileMetadataProvider } from './tile.metadata.provider';

export class TileMetadataTable extends TileMetadataTableBase {
    TileSet: TileMetadataTileSet;
    Imagery: TileMetadataImagery;
    Provider: TileMetadataProvider;

    public constructor() {
        super();
        this.TileSet = new TileMetadataTileSet(this);
        this.Imagery = new TileMetadataImagery(this);
        this.Provider = new TileMetadataProvider(this);
    }
}

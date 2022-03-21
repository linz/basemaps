import { Epsg, GoogleTms, TileMatrixSets } from '@basemaps/geo';
import { fsa, LogConfig } from '@basemaps/shared';
import { CogTiff, TiffTagGeo } from '@cogeotiff/core';
import { TileSetRaster } from '../tile.set.raster.js';

function isTiff(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.tif') || fileName.toLowerCase().endsWith('.tiff');
}

export class TileSetLocal extends TileSetRaster {
  tiffs: CogTiff[];
  filePath: string;
  tileSet = {} as any;

  constructor(name: string, path: string) {
    super(name, GoogleTms);
    this.filePath = path;
    this.tileSet.name = name;
    this.tileSet.title = name;
    this.tileSet.projection = GoogleTms.projection.code;
  }

  setTitle(name: string): void {
    this.tileSet.title = name;
  }

  async load(): Promise<boolean> {
    if (this.tiffs != null) return true;

    const fileList = isTiff(this.filePath) ? [this.filePath] : await fsa.toArray(fsa.list(this.filePath));
    const files = fileList.filter(isTiff);
    if (files.length === 0) throw new Error(`No tiff files found in ${this.filePath}`);

    this.tiffs = files.map((filePath) => new CogTiff(fsa.source(filePath)));

    // Read in the projection information
    const [firstTiff] = this.tiffs;
    await firstTiff.init(true);
    const projection = Epsg.get(firstTiff.getImage(0).valueGeo(TiffTagGeo.ProjectedCSTypeGeoKey) as number);
    this.tileMatrix = TileMatrixSets.get(projection);
    LogConfig.get().info(
      { path: this.filePath, count: this.tiffs.length, tileMatrix: this.tileMatrix.identifier },
      'LoadedTiffs',
    );
    return true;
  }

  getTiffsForTile(): CogTiff[] {
    return this.tiffs;
  }
}

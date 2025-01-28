export const TestDataPath = new URL('../static/', import.meta.url);

const TiffGooglePath = new URL('rgba8.google.tiff', TestDataPath);
const TiffNztm2000Path = new URL('rgba8.nztm2000.tiff', TestDataPath);

const TiffLzw = new URL('red.lzw.tiff', TestDataPath);
const TiffZstd = new URL('red.zstd.tiff', TestDataPath);

export class TestTiff {
  static get Nztm2000(): URL {
    return TiffNztm2000Path;
  }

  static get Google(): URL {
    return TiffGooglePath;
  }

  static get CompressLzw(): URL {
    return TiffLzw;
  }

  static get CompressZstd(): URL {
    return TiffZstd;
  }
  static get CompressRaw(): URL {
    return new URL('red.none.tiff', TestDataPath);
  }
}

export const TestDataPath = new URL('../static/', import.meta.url);

const TiffGooglePath = new URL('rgba8.google.tiff', TestDataPath);
const TiffNztm2000Path = new URL('rgba8.nztm2000.tiff', TestDataPath);
const TiffRgbi16 = new URL('rgbi16.stats.tiff', TestDataPath);

export class TestTiff {
  static get Nztm2000(): URL {
    return TiffNztm2000Path;
  }

  static get Google(): URL {
    return TiffGooglePath;
  }

  /** 16 bit rgbi testing tiff */
  static get Rgbi16(): URL {
    return TiffRgbi16;
  }
}

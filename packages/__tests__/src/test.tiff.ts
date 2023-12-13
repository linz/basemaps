export const TestDataPath = new URL('../static', import.meta.url);

const TiffGooglePath = new URL('rgba8.google.tiff', TestDataPath);
const TiffNztm2000Path = new URL('rgba8.nztm2000.tiff', TestDataPath);

export class TestTiff {
  static get Nztm2000(): URL {
    return TiffNztm2000Path;
  }

  static get Google(): URL {
    return TiffGooglePath;
  }
}

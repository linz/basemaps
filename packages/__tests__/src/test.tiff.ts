export const TestDataPath = new URL('../static/', import.meta.url);

const TiffGooglePath = new URL('rgba8.google.tiff', TestDataPath);
const TiffNztm2000Path = new URL('rgba8.nztm2000.tiff', TestDataPath);
const TiffRgbi16 = new URL('rgbi16.stats.tiff', TestDataPath);
const Float32Dem = new URL('float32.google.tiff', TestDataPath);
const TiffRgbi16Be = new URL('rgbi16.big.endian.tiff', TestDataPath);

export class TestTiff {
  static get Nztm2000(): URL {
    return TiffNztm2000Path;
  }

  static get Google(): URL {
    return TiffGooglePath;
  }

  /**
   * WebMercatorQuad 16 bit rgbi testing tiff
   * Centered approx  x:262144, y:262144, z:19
   */
  static get Rgbi16(): URL {
    return TiffRgbi16;
  }

  /**
   * WebMercatorQuad float32 DEM
   * Centered: approx 0.00, 0.00
   */
  static get Float32Dem(): URL {
    return Float32Dem;
  }

  /** Big Endian version */
  static get Rgbi16Be(): URL {
    return TiffRgbi16Be;
  }
}

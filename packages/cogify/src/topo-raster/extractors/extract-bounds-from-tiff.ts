import { Bounds } from '@basemaps/geo';
import { RasterTypeKey, Tiff, TiffTagGeo } from '@cogeotiff/core';

/**
 * Attempts to extract a bounds set from the given Tiff object.
 *
 * @param tiff: the Tiff object from which to extract a bounds set.
 *
 * @returns a Bounds object, on success. Otherwise, null.
 */
export function extractBoundsFromTiff(tiff: Tiff): Bounds | null {
  const img = tiff.images[0];
  if (img == null) {
    throw new Error(`No images found in Tiff file: ${tiff.source.url.href}`);
  }

  if (img.valueGeo(TiffTagGeo.GTRasterTypeGeoKey) === RasterTypeKey.PixelIsPoint) {
    throw new Error("'Pixel is Point' raster grid spacing is not supported");
  }

  return Bounds.fromBbox(img.bbox);
}

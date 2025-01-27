import { Bounds } from '@basemaps/geo';
import { Epsg } from '@basemaps/geo';
import { Size } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { RasterTypeKey, Tiff, TiffTagGeo } from '@cogeotiff/core';
import path from 'path';

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

const projections: Record<string, Epsg> = {
  'Universal Transverse Mercator Zone': Epsg.Wgs84,
  'Chatham Islands Transverse Mercator 2000': Epsg.Citm2000,
  'New Zealand Transverse Mercator 2000': Epsg.Nztm2000,
};

/**
 * Attempts to extract an epsg value from the given Tiff object.
 *
 * @param tiff: The Tiff object from which to extract an epsg value.
 *
 * @returns an Epsg instance, on success. Otherwise, null.
 */
export function extractEpsgFromTiff(tiff: Tiff, logger?: LogType): Epsg | null {
  const img = tiff.images[0];
  if (img == null) {
    throw new Error(`No images found in Tiff file: ${tiff.source.url.href}`);
  }

  // try to extract the epsg directly from the tiff
  const epsg = img.epsg;

  if (epsg != null) {
    const code = Epsg.tryGet(epsg);

    if (code != null) {
      logger?.info({ found: true, method: 'direct' }, 'extractEpsgFromTiff()');
      return code;
    }
  }

  // try to extract the epsg from the tiff's projected citation geotag
  const tag = img.valueGeo(TiffTagGeo.ProjectedCitationGeoKey);

  if (typeof tag === 'string') {
    for (const [citation, epsg] of Object.entries(projections)) {
      if (tag.startsWith(citation)) {
        logger?.info({ found: true, method: 'geotag' }, 'extractEpsgFromTiff()');
        return epsg;
      }
    }
  }

  logger?.info({ found: false }, 'extractEpsgFromTiff()');
  return null;
}

/**
 * Attempts to extract a map code and version from the filename of the provided filepath.
 * Throws an error if either detail cannot be parsed.
 *
 * @param file: the filepath from which to extract a map code and version.
 *
 * @example
 * file: "s3://linz-topographic-upload/topographic/TopoReleaseArchive/NZTopo50_GeoTif_Gridless/CJ10_GRIDLESS_GeoTifv1-00.tif"
 * returns: { mapCode: "CJ10", version: "v1-00" }
 *
 * @returns an object containing the map code and version.
 */
export function extractMapCodeAndVersion(file: string, logger?: LogType): { mapCode: string; version: string } {
  const url = new URL(file);
  const filePath = path.parse(url.href);
  const fileName = filePath.name;

  // extract map code from head of the file name (e.g. CJ10)
  const mapCode = fileName.split('_')[0];
  if (mapCode == null) throw new Error('Map sheet not found in the file name');

  // extract version from tail of the file name (e.g. v1-00)
  const version = fileName.match(/v(\d)-(\d\d)/)?.[0];
  if (version == null) throw new Error('Version not found in the file name');

  logger?.info({ mapCode, version }, 'extractMapCodeAndVersion()');
  return { mapCode, version };
}

/**
 * Attempts to extract a size from the given Tiff object.
 *
 * @param tiff: the Tiff object from which to extract the size.
 *
 * @returns a Size object, on success. Otherwise, null.
 */
export function extractSizeFromTiff(tiff: Tiff, logger?: LogType): Size | null {
  try {
    const size = tiff.images[0]?.size ?? null;

    logger?.info({ found: size }, 'extractSizeFromTiff()');
    return size;
  } catch (e) {
    logger?.info({ found: false }, 'extractSizeFromTiff()');
    return null;
  }
}

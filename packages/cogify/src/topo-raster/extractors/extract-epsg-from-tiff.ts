import { Epsg } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { Tiff, TiffTagGeo } from '@cogeotiff/core';

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

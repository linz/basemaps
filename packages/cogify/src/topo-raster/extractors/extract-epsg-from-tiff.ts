import { Epsg } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { Tiff, TiffTagGeo } from '@cogeotiff/core';

import { extractEpsg } from '../../generate-path/path.generate.js';

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
  // try to extract the epsg directly from the tiff
  try {
    const epsg = Epsg.get(extractEpsg(tiff));

    logger?.info({ found: true, method: 'direct' }, 'extractEpsgFromTiff()');
    return epsg;
  } catch {
    // try to extract the epsg from the tiff's projected citation geotag
    const tag = tiff.images[0]?.valueGeo(TiffTagGeo.ProjectedCitationGeoKey);

    if (typeof tag === 'string') {
      for (const [citation, epsg] of Object.entries(projections)) {
        if (tag.startsWith(citation)) {
          logger?.info({ found: true, method: 'geotag' }, 'extractEpsgFromTiff()');
          return epsg;
        }
      }
    }
  }

  logger?.info({ found: false }, 'extractEpsgFromTiff()');
  return null;
}

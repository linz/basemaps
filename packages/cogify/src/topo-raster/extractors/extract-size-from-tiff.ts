import { Size } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { Tiff } from '@cogeotiff/core';

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

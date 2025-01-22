import { Bounds } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { Tiff } from '@cogeotiff/core';

import { findBoundingBox } from '../../../utils/geotiff.js';

/**
 * Attempts to extract a bounds set from the given Tiff object.
 *
 * @param tiff: the Tiff object from which to extract a bounds set.
 *
 * @returns a Bounds object, on success. Otherwise, null.
 */
export async function extractBoundsFromTiff(tiff: Tiff, logger?: LogType): Promise<Bounds | null> {
  try {
    const bounds = Bounds.fromBbox(await findBoundingBox(tiff));

    logger?.info({ found: true }, 'extractBoundsFromTiff()');
    return bounds;
  } catch (e) {
    logger?.info({ found: false }, 'extractBoundsFromTiff()');
    return null;
  }
}

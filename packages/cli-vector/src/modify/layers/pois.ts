import { LogType } from '@basemaps/shared';

import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';
import { getInaccessibilityPole } from '../shared.js';

/**
 * Processes a 'pois' layer feature.
 *
 * @param feature - the feature to process
 * @param options - the layer's options
 * @param logger - a logger instance
 * @returns the processed feature
 */
export function handleLayerPois(feature: VectorGeoFeature, logger: LogType): VectorGeoFeature | null {
  logger.trace({}, 'HandlePois:Start');
  feature = structuredClone(feature);

  if (feature.properties['building'] === 'building') {
    const bldgUse = feature.properties['bldg_use'];

    if (bldgUse == null) {
      // discard the feature
      logger.trace({}, 'HandlePois:End');
      return null;
    }

    feature.properties['building'] = bldgUse;

    // Convert the building polygon to a point for 50246-nz-building-polygons-topo-150k
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      feature.geometry = getInaccessibilityPole(feature.geometry, logger);
    }
  }

  logger.trace({}, 'HandlePois:End');
  return feature;
}

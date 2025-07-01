import { LogType } from '@basemaps/shared';
import { z } from 'zod';

import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';
import { zPlaceLabelsProperties } from '../parser.js';

/**
 *  Processes a 'place_labels' layer feature.
 *
 * @param feature - the feature to process
 * @param options - the layer's options
 * @param logger - a logger instance
 * @returns the processed feature
 */
export function handleLayerPlaceLabels(feature: VectorGeoFeature, logger: LogType): VectorGeoFeature | null {
  logger.trace({}, 'HandlePlaceLabels:Start');

  try {
    feature = structuredClone(feature);

    const properties = zPlaceLabelsProperties.parse({
      label: feature.properties['label'],
      admin_level: feature.properties['adminlevel'],
      natural: feature.properties['natural'],
      place: feature.properties['place'],
      water: feature.properties['water'],
    });

    feature.properties = properties;
    // TODO: once we finalise the new style entries, we will update the desired `minzoom` and `maxzoom` values.
    feature.tippecanoe.minzoom = properties.admin_level;

    logger.trace({}, 'HandlePlaceLabels:End');
    return feature;
  } catch (e) {
    // discard the handful of features with null-valued `label` properties.
    if (e instanceof z.ZodError) {
      logger.trace({ properties: feature.properties }, 'Failed to parse required properties. Discarding feature.');
    }

    return null;
  }
}

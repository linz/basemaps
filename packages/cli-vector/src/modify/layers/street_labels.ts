import { LogType } from '@basemaps/shared';

import { VectorCreationOptions } from '../../stac.js';
import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';
import { handleRoadFeature } from '../shared.js';

/**
 * Processes a 'street_labels' layer feature.
 *
 * @param feature - the feature to process
 * @param options - the layer's options
 * @param logger - a logger instance
 * @returns the processed feature
 */
export function handleLayerStreetLabels(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.trace({}, 'HandleStreetLabels:Start');
  const kind = options.layer.tags['kind'];

  switch (kind) {
    case 'road':
      feature = handleKindRoad(feature, options, logger);
      break;
  }

  logger.trace({}, 'HandleStreetLabels:End');
  return feature;
}

/**
 * Processes a 'street_labels' layer feature with a 'kind' value of 'road'.
 *
 * @param feature - the feature to process
 * @param logger - a logger instance
 * @returns the processed feature
 */
function handleKindRoad(feature: VectorGeoFeature, options: VectorCreationOptions, logger: LogType): VectorGeoFeature {
  logger.trace({}, 'HandleKindRoad:Start');
  feature = handleRoadFeature(feature, options, logger);

  logger.trace({}, 'HandleKindRoad:End');
  return feature;
}

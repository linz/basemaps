import { LogType } from '@basemaps/shared';

import { VectorCreationOptions } from '../../stac.js';
import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';
import { getInaccessibilityPole } from '../shared.js';

/**
 * Processes a 'public_transport' layer feature.
 *
 * @param feature - the feature to process
 * @param options - the layer's options
 * @param logger - a logger instance
 * @returns the processed feature
 */
export function handleLayerPublicTransport(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.trace({}, 'HandlePublicTransport:Start');
  const kind = options.layer.tags['kind'];

  switch (kind) {
    case 'aerodrome':
      feature = handleKindAerodrome(feature, logger);
      break;
  }

  logger.trace({}, 'HandlePublicTransport:End');
  return feature;
}

/**
 * Processes a 'public_transport' layer feature with a 'kind' value of 'aerodrome'.
 *
 * @param feature - the feature to process
 * @param logger - a logger instance
 * @returns the processed feature
 */
function handleKindAerodrome(feature: VectorGeoFeature, logger: LogType): VectorGeoFeature {
  logger.trace({}, 'HandleKindAerodrome:Start');
  feature = structuredClone(feature);

  feature.geometry = getInaccessibilityPole(feature.geometry, logger);

  logger.trace({}, 'HandleKindAerodrome:End');
  return feature;
}

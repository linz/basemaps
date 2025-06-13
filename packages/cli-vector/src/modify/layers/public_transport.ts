import { LogType } from '@basemaps/shared';
import { Point } from 'geojson';

import { VectorCreationOptions } from '../../stac.js';
import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';
import { getCoordinates, polylabel } from '../shared.js';

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

  const coordinates = getCoordinates(feature.geometry, logger);
  // REVIEW: the following resource suggests using a precision value of 0.000001 for geo-coords:
  // https://github.com/mapbox/polylabel?tab=readme-ov-file#javascript-usage
  // currently, we use the default value of 1.0
  const inaccessibilityPole = polylabel(coordinates);

  const point: Point = { type: 'Point', coordinates: inaccessibilityPole };
  feature.geometry = point;

  logger.trace({}, 'HandleKindAerodrome:End');
  return feature;
}

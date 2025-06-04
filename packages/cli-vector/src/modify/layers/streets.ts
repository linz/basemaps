import { LogType } from '@basemaps/shared';

import { VectorCreationOptions } from '../../stac.js';
import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';
import { handleRoadFeature } from '../shared.js';

/**
 * Processes a 'streets' layer feature.
 *
 * @param feature - the feature to process
 * @param options - the layer's options
 * @param logger - a logger instance
 * @returns the processed feature
 */
export function handleLayerStreets(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.trace({}, 'HandleStreets:Start');
  feature = structuredClone(feature);
  const kind = options.layer.tags['kind'];

  switch (kind) {
    case 'road':
      feature = handleKindRoad(feature, options, logger);
      break;
    case 'track':
      feature = handleKindTrack(feature, logger);
      break;
  }

  Object.entries(feature.properties).forEach(([key, value]) => {
    // Update bridge and tunnel to boolean
    if (value === 'true') {
      feature.properties[key] = true;
    } else if (value === 'false') {
      feature.properties[key] = false;
    }
  });

  logger.trace({}, 'HandleStreets:End');
  return feature;
}

/**
 * Processes a 'streets' layer feature with a 'kind' value of 'road'.
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

/**
 * Processes a 'streets' layer feature with a 'kind' value of 'track'.
 *
 * @param feature - the feature to process
 * @param logger - a logger instance
 * @returns the processed feature
 */
function handleKindTrack(feature: VectorGeoFeature, logger: LogType): VectorGeoFeature {
  logger.trace({}, 'HandleKindTrack:Start');
  feature = structuredClone(feature);

  // calculate the 'subclass' property
  let subclass = feature.properties['track_use'];

  const trackType = feature.properties['track_type'];
  if (trackType != null) subclass += `_${trackType}`;

  const status = feature.properties['status'];
  if (status != null) subclass += `_${status}`;

  // append/override tags
  feature.properties['subclass'] = subclass;
  logger.trace({ subclass }, 'new/overidden tags');

  // return feature
  logger.trace({}, 'HandleKindTrack:End');
  return feature;
}

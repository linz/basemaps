import { LogType } from '@basemaps/shared';

import { VectorCreationOptions } from '../../stac.js';
import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';

/**
 * Processes a 'contours' layer feature.
 *
 * @param feature - the feature to process
 * @param options - the layer's options
 * @param logger
 * @returns the processed feature
 */
export function handleLayerContours(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.info({}, 'HandleContours:Start');
  const kind = options.layer.tags['kind'];

  switch (kind) {
    case 'contours':
      feature = handleKindContours(feature, logger);
      break;
    case 'peak':
      feature = handleKindPeak(feature, logger);
      break;
  }

  logger.info({}, 'HandleContours:End');
  return feature;
}

/**
 * Processes a 'contours' layer feature with a 'kind' value of 'contours'.
 *
 * @param feature - the feature to process
 * @param logger
 * @returns the processed feature
 */
export function handleKindContours(feature: VectorGeoFeature, logger?: LogType): VectorGeoFeature {
  logger?.info({}, 'HandleKindContours:Start');
  feature = structuredClone(feature);

  // read the 'elevation' property
  const elevation = feature.properties['elevation'];
  if (typeof elevation !== 'number') throw new Error('Elevation is not a number');

  // if 'elevation' is divisble by 100 with no remainder
  if (elevation % 100 === 0) {
    // append 'type' property
    const type = 'index';
    feature.properties['type'] = type;
    logger?.info({ type }, 'new/overidden tags');
  } else {
    // override 'minzoom'
    const minzoom = 14;
    feature.tippecanoe.minzoom = minzoom;
    logger?.info({ minzoom }, 'overidden styles');
  }

  logger?.info({}, 'HandleKindContours:End');
  return feature;
}

/**
 * Processes a 'contours' layer feature with a 'kind' value of 'peak'.
 *
 * @param feature - the feature to process
 * @param logger
 * @returns the processed feature
 */
export function handleKindPeak(feature: VectorGeoFeature, logger?: LogType): VectorGeoFeature {
  logger?.info({}, 'HandleKindPeak:Start');
  feature = structuredClone(feature);

  // read the 'elevation' property
  const elevation = feature.properties['elevation'];
  if (typeof elevation !== 'number') throw new Error('Elevation is not a number');

  let rank: number;
  if (elevation >= 2000) {
    rank = 1;
  } else if (elevation >= 1500) {
    rank = 2;
  } else if (elevation >= 1000) {
    rank = 3;
  } else if (elevation >= 500) {
    rank = 4;
  } else {
    rank = 5;
  }

  // append 'rank' property
  feature.properties['rank'] = rank;
  logger?.info({ rank }, 'new/overidden tags');

  logger?.info({}, 'HandleKindPeak:End');
  return feature;
}

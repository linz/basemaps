import { LogType } from '@basemaps/shared';

import { VectorCreationOptions } from '../../stac.js';
import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';
import { handleRoadFeature } from '../shared.js';

export function handleLayerStreets(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.debug({}, 'HandleStreets:Start');
  feature = handleRoadFeature(feature, options, logger);

  logger.debug({}, 'HandleStreets:End');
  return feature;
}

import { LogType } from '@basemaps/shared';

import { VectorCreationOptions } from '../../stac.js';
import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';
import { handleRoadFeature } from '../shared.js';

export function handleLayerStreetLabels(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.trace({}, 'HandleStreetLabels:Start');
  feature = structuredClone(feature);
  const kind = options.layer.tags['kind'];

  switch (kind) {
    case 'road':
      feature = handleKindRoad(feature, options, logger);
      break;
  }

  logger.trace({}, 'HandleStreetLabels:End');
  return feature;
}

function handleKindRoad(feature: VectorGeoFeature, options: VectorCreationOptions, logger: LogType): VectorGeoFeature {
  logger.trace({}, 'HandleKindRoad:Start');
  feature = handleRoadFeature(feature, options, logger);

  logger.trace({}, 'HandleKindRoad:End');
  return feature;
}

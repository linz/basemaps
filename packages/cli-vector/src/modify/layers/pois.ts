import { LogType } from '@basemaps/shared';

import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';

export function handleLayerPois(feature: VectorGeoFeature, logger: LogType): VectorGeoFeature | null {
  logger.trace({}, 'HandlePois:Start');
  feature = structuredClone(feature);

  // REVIEW: We don't have any use for this criteria as we don't include the following layers:
  // 1. 50245-nz-building-points-topo-150k
  // 2. 50246-nz-building-polygons-topo-150k
  if (feature.properties['building'] === 'building') {
    const bldgUse = feature.properties['bldg_use'];

    if (bldgUse == null) {
      // discard the feature
      logger.trace({}, 'HandlePois:End');
      return null;
    }

    feature.properties['building'] = bldgUse;
  }

  logger.trace({}, 'HandlePois:End');
  return feature;
}

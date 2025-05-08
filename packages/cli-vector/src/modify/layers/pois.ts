import { LogType } from '@basemaps/shared';

import { VectorGeoFeature } from '../../generalization/generalization.js';

export function handleLayerPois(feature: VectorGeoFeature, logger: LogType): VectorGeoFeature | null {
  logger.info({}, 'HandlePois:Start');
  feature = structuredClone(feature);

  if (feature.properties['building'] === 'building') {
    const bldgUse = feature.properties['bldg_use'];

    if (bldgUse == null) {
      // discard the feature
      logger.info({}, 'HandlePois:End');
      return null;
    }

    feature.properties['building'] = bldgUse;
  }

  logger.info({}, 'HandlePois:End');
  return feature;
}

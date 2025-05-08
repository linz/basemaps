import { LogType } from '@basemaps/shared';

import { VectorGeoFeature } from '../../generalization/generalization.js';
import { VectorCreationOptions } from '../../stac.js';
import { MajorHighWays } from '../consts.js';

export function handleLayerStreets(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.info({}, 'HandleStreets:Start');
  feature = structuredClone(feature);

  // REVIEW: the following logic is very similar (but different)
  // to the handleKindRoad function's logic. We should reusue.
  const highwayNum = feature.properties['hway_num'];
  if (typeof highwayNum === 'string') {
    // append/override tags
    const kind = 'motorway';
    feature.properties['kind'] = kind;
    const ref = highwayNum;
    feature.properties['ref'] = ref;
    logger.info({ kind, ref }, 'new/overidden tags');

    // override styles
    const minzoom = MajorHighWays.has(highwayNum) ? 2 : 8;
    feature.tippecanoe.minzoom = minzoom;
    logger.info({ minzoom }, 'overidden styles');

    // return feature
    logger.info({}, 'HandleStreets:End');
    return feature;
  }

  const laneCount = feature.properties['lane_count'];
  if (typeof laneCount === 'number') {
    // append/override tags
    const kind = laneCount >= 4 ? 'primary' : 'secondary';
    feature.properties['kind'] = kind;
    logger.info({ kind }, 'new/overidden tags');
  }

  // override styles
  if (options.layer.style.minZoom < 10) {
    const minzoom = 10;
    feature.tippecanoe.minzoom = minzoom;
    logger.info({ minzoom }, 'overidden styles');
  }

  // return feature
  logger.info({}, 'HandleStreets:End');
  return feature;
}

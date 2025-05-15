import { LogType } from '@basemaps/shared';

import { VectorCreationOptions } from '../../stac.js';
import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';
import { MajorHighWays } from '../consts.js';

export function handleLayerStreetLabels(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.info({}, 'HandleStreetLabels:Start');
  feature = structuredClone(feature);
  const kind = options.layer.tags['kind'];

  switch (kind) {
    case 'road':
      feature = handleKindRoad(feature, options, logger);
      break;
  }

  logger.info({}, 'HandleStreetLabels:End');
  return feature;
}

function handleKindRoad(feature: VectorGeoFeature, options: VectorCreationOptions, logger: LogType): VectorGeoFeature {
  logger.info({}, 'HandleKindRoad:Start');
  feature = structuredClone(feature);

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
    logger.info({}, 'HandleKindRoad:End');
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
  logger.info({}, 'HandleKindRoad:End');
  return feature;
}

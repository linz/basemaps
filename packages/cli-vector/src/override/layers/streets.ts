import { LogType } from '@basemaps/shared';

import { VectorGeoFeature } from '../../generalization/generalization.js';
import { VectorCreationOptions } from '../../stac.js';

export const MajorHighWays: Readonly<Set<string>> = new Set([
  '1',
  '1B',
  '2',
  '3',
  '3A',
  '4',
  '5',
  '6',
  '6A',
  '7',
  '8',
  '8A',
  '18',
  '20',
  '51',
  '76',
  '73',
  '1,3',
  '6,94',
  '6,96',
]);

export function handleLayerStreets(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.info({}, 'HandleStreets:Start');
  feature = structuredClone(feature);

  const highwayNum = feature.properties['hway_num'];
  if (typeof highwayNum === 'string') {
    const kind = 'motorway';
    feature.properties['kind'] = kind;
    logger.info({ kind }, 'new/overidden tags');

    let minzoom;
    if (MajorHighWays.has(highwayNum)) {
      minzoom = 2;
    } else {
      minzoom = 8;
    }

    feature.tippecanoe.minzoom = minzoom;
    logger.info({ minzoom }, 'overidden styles');

    logger.info({}, 'HandleStreets:End');
    return feature;
  }

  const laneCount = feature.properties['lane_count'];
  if (typeof laneCount === 'number') {
    let kind;
    if (laneCount >= 4) {
      kind = 'primary';
    } else {
      kind = 'secondary';
    }

    feature.properties['kind'] = kind;
    logger.info({ kind }, 'new/overidden tags');
  }

  if (options.layer.style.minZoom < 10) {
    const minzoom = 10;
    feature.tippecanoe.minzoom = minzoom;
    logger.info({ minzoom }, 'overidden styles');
  }

  logger.info({}, 'HandleStreets:End');
  return feature;
}

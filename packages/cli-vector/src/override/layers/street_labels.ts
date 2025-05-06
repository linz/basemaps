import { LogType } from '@basemaps/shared';

import { VectorGeoFeature } from '../../generalization/generalization.js';
import { VectorCreationOptions } from '../../stac.js';
import { MajorHighWays } from './streets.js';

export function handleLayerStreetLabels(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.info({}, 'HandleStreetLabels:Start');
  feature = structuredClone(feature);
  const kind = options.layer.tags['kind'];

  // Tag street labels for road
  if (kind === 'road') {
    const highwayNum = feature.properties['hway_num'];
    if (typeof highwayNum === 'string') {
      const kind = 'motorway';
      const ref = highwayNum;
      feature.properties['kind'] = kind;
      feature.properties['ref'] = ref;
      logger.info({ kind, ref }, 'new/overidden tags');

      let minzoom;
      if (MajorHighWays.has(highwayNum)) {
        minzoom = 2;
      } else {
        minzoom = 8;
      }

      feature.tippecanoe.minzoom = minzoom;
      logger.info({ minzoom }, 'overidden styles');

      logger.info({}, 'HandleStreetLabels:End');
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
  }

  logger.info({}, 'HandleStreetLabels:End');
  return feature;
}

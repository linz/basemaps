import { LogType } from '@basemaps/shared';
import geojsonArea from '@mapbox/geojson-area';

import { VectorGeoFeature } from '../../generalization/generalization.js';
import { VectorCreationOptions } from '../../stac.js';

export const LargeLakeSize = 4_000_000;

export function handleLayerWaterPolygons(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.info({}, 'HandleWaterPolygons:Start');
  feature = structuredClone(feature);
  const kind = options.layer.tags['kind'];

  if (kind === 'water') {
    // Update lake name from grp_name
    const name = feature.properties['name'];
    if (name == null) {
      const grpName = feature.properties['grp_name'];
      feature.properties['name'] = grpName;
      logger.info({ name: grpName }, 'new/overidden tags');
    }

    // Rank large lakes by lake size
    const area = geojsonArea.geometry(feature.geometry);

    let minzoom;
    if (area >= LargeLakeSize) {
      minzoom = 1;
    } else {
      minzoom = 9;
    }

    feature.tippecanoe.minzoom = minzoom;
    logger.info({ minzoom }, 'overidden styles');
  }

  const orientatn = feature.properties['orientatn'];
  if (orientatn != null) {
    const direction = orientatn;
    feature.properties['direction'] = direction;
    logger.info({ direction }, 'new/overidden tags');
  }

  if (kind === 'river') {
    if (options.layer.style.minZoom < 11) {
      const name = feature.properties['name'];
      if (name === '') {
        const minzoom = 11;
        feature.tippecanoe.minzoom = minzoom;
        logger.info({ minzoom }, 'overidden styles');
      }
    }
  }

  logger.info({}, 'HandleWaterPolygons:End');
  return feature;
}

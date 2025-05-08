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

  switch (kind) {
    case 'water':
      feature = handleKindWater(feature, logger);
      break;
    case 'river':
      feature = handleKindRiver(feature, options, logger);
      break;
  }

  const orientatn = feature.properties['orientatn'];

  if (orientatn != null) {
    const direction = orientatn;
    feature.properties['direction'] = direction;
    logger.info({ direction }, 'new/overidden tags');
  }

  logger.info({}, 'HandleWaterPolygons:End');
  return feature;
}

function handleKindWater(feature: VectorGeoFeature, logger: LogType): VectorGeoFeature {
  logger.info({}, 'HandleKindWater:Start');
  feature = structuredClone(feature);

  const name = feature.properties['name'];
  if (name == null) {
    // inherit the lake's name from the feature's 'grp_name' property
    const grpName = feature.properties['grp_name'];
    feature.properties['name'] = grpName;
    logger.info({ name: grpName }, 'new/overidden tags');
  }

  // determine if the lake is large
  const area = geojsonArea.geometry(feature.geometry);

  const minzoom = area >= LargeLakeSize ? 1 : 9;
  feature.tippecanoe.minzoom = minzoom;
  logger.info({ minzoom }, 'overidden styles');

  logger.info({}, 'HandleKindWater:End');
  return feature;
}

function handleKindRiver(feature: VectorGeoFeature, options: VectorCreationOptions, logger: LogType): VectorGeoFeature {
  logger.info({}, 'HandleKindRiver:Start');
  feature = structuredClone(feature);

  if (options.layer.style.minZoom < 11) {
    const name = feature.properties['name'];

    if (name === '') {
      const minzoom = 11;
      feature.tippecanoe.minzoom = minzoom;
      logger.info({ minzoom }, 'overidden styles');
    }
  }

  logger.info({}, 'HandleKindRiver:End');
  return feature;
}

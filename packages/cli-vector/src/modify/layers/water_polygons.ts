import { LogType } from '@basemaps/shared';
import geojsonArea from '@mapbox/geojson-area';

import { VectorCreationOptions } from '../../stac.js';
import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';

export const LargeLakeSize = 4_000_000;

export function handleLayerWaterPolygons(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.trace({}, 'HandleWaterPolygons:Start');
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
    logger.trace({ direction }, 'new/overidden tags');
  }

  logger.trace({}, 'HandleWaterPolygons:End');
  return feature;
}

function handleKindWater(feature: VectorGeoFeature, logger: LogType): VectorGeoFeature {
  logger.trace({}, 'HandleKindWater:Start');
  feature = structuredClone(feature);

  const name = feature.properties['name'];
  if (name == null) {
    // inherit the lake's name from the feature's 'grp_name' property
    const grpName = feature.properties['grp_name'];
    feature.properties['name'] = grpName;
    logger.trace({ name: grpName }, 'new/overidden tags');
  }

  // determine if the lake is large
  const area = geojsonArea.geometry(feature.geometry);

  const minzoom = area >= LargeLakeSize ? 1 : 9;
  feature.tippecanoe.minzoom = minzoom;
  logger.trace({ minzoom }, 'overidden styles');

  logger.trace({}, 'HandleKindWater:End');
  return feature;
}

function handleKindRiver(feature: VectorGeoFeature, options: VectorCreationOptions, logger: LogType): VectorGeoFeature {
  logger.trace({}, 'HandleKindRiver:Start');
  feature = structuredClone(feature);

  if (options.layer.style.minZoom < 11) {
    const name = feature.properties['name'];

    if (name === '') {
      const minzoom = 11;
      feature.tippecanoe.minzoom = minzoom;
      logger.trace({ minzoom }, 'overidden styles');
    }
  }

  logger.trace({}, 'HandleKindRiver:End');
  return feature;
}

import { LogType } from '@basemaps/shared';
import { Area, MultiPolygon, Polygon } from '@linzjs/geojson';

import { VectorCreationOptions } from '../../stac.js';
import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';

export const LargeLakeSize = 4_000_000;

/**
 * Processes a 'water_polygons' layer feature.
 *
 * @param feature - the feature to process
 * @param options - the layer's options
 * @param logger - a logger instance
 * @returns the processed feature
 */
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

/**
 * Processes a 'water_polygons' layer feature with a 'kind' value of 'water'.
 *
 * @param feature - the feature to process
 * @param logger - a logger instance
 * @returns the processed feature
 */
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
  let area = 0;
  if (feature.geometry.type === 'MultiPolygon') {
    area = Area.multiPolygon(feature.geometry.coordinates as MultiPolygon);
  } else if (feature.geometry.type === 'Polygon') {
    // for a single polygon, we can use the Area.polygon method directly
    area = Area.polygon(feature.geometry.coordinates as Polygon);
  }

  const minzoom = area >= LargeLakeSize ? 1 : 9;
  feature.tippecanoe.minzoom = minzoom;
  logger.trace({ minzoom }, 'overidden styles');

  logger.trace({}, 'HandleKindWater:End');
  return feature;
}

/**
 * Processes a 'water_polygons' layer feature with a 'kind' value of 'river'.
 *
 * @param feature - the feature to process
 * @param logger - a logger instance
 * @returns the processed feature
 */
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

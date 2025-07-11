import { LogType } from '@basemaps/shared';

import { VectorCreationOptions } from '../../stac.js';
import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';

export const LargeLakeSize = 4_000_000;

/**
 * Processes a 'water_lines' or 'water_polygons' layer feature.
 *
 * @param feature - the feature to process
 * @param options - the layer's options
 * @param logger - a logger instance
 * @returns the processed feature
 */
export function handleLayerWater(
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
  if (feature.properties['water'] === 'lake') {
    const aera = feature.properties['_derived_area'];
    if (aera != null && Number(aera) >= LargeLakeSize) {
      feature.tippecanoe.minzoom = 1;
    } else {
      feature.tippecanoe.minzoom = 9;
    }
  }

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

    if (name === '' && feature.tippecanoe.minzoom < 11) {
      const minzoom = 11;
      feature.tippecanoe.minzoom = minzoom;
      logger.trace({ minzoom }, 'overidden styles');
    }
  }

  logger.trace({}, 'HandleKindRiver:End');
  return feature;
}

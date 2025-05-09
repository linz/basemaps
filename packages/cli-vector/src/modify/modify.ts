import { LogType } from '@basemaps/shared';

import { VectorCreationOptions } from '../stac.js';
import { VectorGeoFeature } from '../types/VectorGeoFeature.js';
import { handleLayerContours } from './layers/contours.js';
import { handleLayerPlaceLabels } from './layers/place_labels.js';
import { handleLayerPois } from './layers/pois.js';
import { handleLayerPublicTransport } from './layers/public_transport.js';
import { handleLayerStreetLabels } from './layers/street_labels.js';
import { handleLayerStreets } from './layers/streets.js';
import { handleLayerWaterPolygons } from './layers/water_polygons.js';

/**
 * special tag function to check if the name to decide whether to do special tags
 *  Include like place_labels, pois(for building poi), contours, public_transport, street_labels/streets, water_lines/water_polygons
 *
 * For a given feature and the Shortbread layer to which we've assigned it, we may need to adjust the feature's metadata (i.e. properties) so that we can distinguish it from others in the same layer.
 * Such distinctions include marking road-type features based on whether they describe motorway, primary, or secondary roads, so we can style each set differently.
 */
export function modifyFeature(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature | null {
  const id = options.layer.id; // lds dataset id
  const layerName = options.name; // shortbread layer

  logger.info({ id, layerName }, 'ModifyFeature:Start');
  let modifiedFeature: VectorGeoFeature | null;

  switch (layerName) {
    case 'contours':
      modifiedFeature = handleLayerContours(feature, options, logger);
      break;
    case 'place_labels':
      modifiedFeature = handleLayerPlaceLabels(feature, logger);
      break;
    case 'pois':
      modifiedFeature = handleLayerPois(feature, logger);
      break;
    case 'public_transport':
      modifiedFeature = handleLayerPublicTransport(feature, options, logger);
      break;
    case 'street_labels':
      modifiedFeature = handleLayerStreetLabels(feature, options, logger);
      break;
    case 'streets':
      modifiedFeature = handleLayerStreets(feature, options, logger);
      break;
    case 'water_polygons':
      modifiedFeature = handleLayerWaterPolygons(feature, options, logger);
      break;
    default:
      modifiedFeature = structuredClone(feature);
  }

  logger.info({ id, layerName }, 'ModifyFeature:End');
  return modifiedFeature;
}

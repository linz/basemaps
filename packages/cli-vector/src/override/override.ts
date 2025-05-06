import { LogType } from '@basemaps/shared';

import { VectorGeoFeature } from '../generalization/generalization.js';
import { VectorCreationOptions } from '../stac.js';
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
 * For a given feature and its layer, we may need to adjust the feature's metadata (i.e. properties) so that we can distinguish it from others in the same layer.
 * Such distinctions include marking road-type features based on whether they describe motorway, primary, or secondary roads, so we can style each set differently.
 */
export function overrideFeature(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature | null {
  const id = options.layer.id; // lds dataset id
  const layerName = options.name; // shortbread layer

  logger.info({ 'options.layer.id': id, 'options.name': layerName }, 'OverrideFeature:Start');

  try {
    switch (layerName) {
      case 'contours':
        return handleLayerContours(feature, options, logger);
      case 'place_labels':
        return handleLayerPlaceLabels(feature, logger);
      case 'pois':
        return handleLayerPois(feature, logger);
      case 'public_transport':
        return handleLayerPublicTransport(feature, options, logger);
      case 'street_labels':
        return handleLayerStreetLabels(feature, options, logger);
      case 'streets':
        return handleLayerStreets(feature, options, logger);
      case 'water_polygons':
        return handleLayerWaterPolygons(feature, options, logger);
    }
  } finally {
    logger.info({}, 'OverrideFeature:End');
  }

  return feature;
}

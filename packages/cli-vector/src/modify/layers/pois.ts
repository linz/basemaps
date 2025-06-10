import { LogType } from '@basemaps/shared';
import { Point } from 'geojson';

import { VectorGeoFeature } from '../../types/VectorGeoFeature.js';
import { getCoordinates, polylabel } from '../shared.js';

/**
 * Processes a 'pois' layer feature.
 *
 * @param feature - the feature to process
 * @param options - the layer's options
 * @param logger - a logger instance
 * @returns the processed feature
 */
export function handleLayerPois(feature: VectorGeoFeature, logger: LogType): VectorGeoFeature | null {
  logger.trace({}, 'HandlePois:Start');
  feature = structuredClone(feature);

  if (feature.properties['building'] === 'building') {
    const bldgUse = feature.properties['bldg_use'];

    if (bldgUse == null) {
      // discard the feature
      logger.trace({}, 'HandlePois:End');
      return null;
    }

    feature.properties['building'] = bldgUse;

    // Covert the building polygon to a point for 50246-nz-building-polygons-topo-150k
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      const coordinates = getCoordinates(feature.geometry, logger);
      const inaccessibilityPole = polylabel(coordinates);

      const point: Point = { type: 'Point', coordinates: inaccessibilityPole };
      feature.geometry = point;
    }
  }

  logger.trace({}, 'HandlePois:End');
  return feature;
}

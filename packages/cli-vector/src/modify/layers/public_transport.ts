import { LogType } from '@basemaps/shared';
import { Geometry, Point, Position } from 'geojson';
import polylabel from 'polylabel';

import { VectorGeoFeature } from '../../generalization/generalization.js';
import { VectorCreationOptions } from '../../stac.js';

export function handleLayerPublicTransport(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.info({}, 'HandlePublicTransport:Start');
  const kind = options.layer.tags['kind'];

  switch (kind) {
    case 'aerodrome':
      feature = handleKindAerodrome(feature, logger);
      break;
  }

  logger.info({}, 'HandlePublicTransport:End');
  return feature;
}

function handleKindAerodrome(feature: VectorGeoFeature, logger: LogType): VectorGeoFeature {
  logger.info({}, 'HandleKindAerodrome:Start');
  feature = structuredClone(feature);

  const coordinates = getCoordinates(feature.geometry, logger);
  // REVIEW: the following resource suggests using a precision value of 0.000001 for geo-coords
  // https://github.com/mapbox/polylabel?tab=readme-ov-file#javascript-usage
  const inaccessibilityPole = polylabel.default(coordinates);

  const point: Point = { type: 'Point', coordinates: inaccessibilityPole };
  feature.geometry = point;

  logger.info({}, 'HandleKindAerodrome:Start');
  return feature;
}

function getCoordinates(geometry: Geometry, logger: LogType): Position[][] {
  switch (geometry.type) {
    case 'MultiPolygon':
      return geometry.coordinates[0];
    case 'Polygon':
      return geometry.coordinates;
  }

  logger.error({ type: geometry.type }, 'Unsupported geometry type');
  throw new Error('Unsupported geometry type');
}

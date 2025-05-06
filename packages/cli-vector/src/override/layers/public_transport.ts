import { LogType } from '@basemaps/shared';
import { Point } from 'geojson';
import * as poly from 'polylabel';

import { VectorGeoFeature } from '../../generalization/generalization.js';
import { VectorCreationOptions } from '../../stac.js';

// @types/polylabel is wrong
const polylabel = poly.default as unknown as (polygon: number[][][], precision?: number, debug?: boolean) => number[];

export function handleLayerPublicTransport(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.info({}, 'HandlePublicTransport:Start');
  feature = structuredClone(feature);
  const kind = options.layer.tags['kind'];

  // Create label point (pole of inaccessibility) from airport polygon
  if (kind === 'aerodrome') {
    if (feature.geometry.type === 'MultiPolygon') {
      // TODO: Worth to try create a point for each polygon and see how it looks line.
      const xyCoordinates = polylabel(feature.geometry.coordinates[0]);

      const point: Point = {
        type: 'Point',
        coordinates: xyCoordinates,
      };

      feature.geometry = point;
    } else if (feature.geometry.type === 'Polygon') {
      const xyCoordinates = polylabel(feature.geometry.coordinates);

      const point: Point = {
        type: 'Point',
        coordinates: xyCoordinates,
      };

      feature.geometry = point;
    }
  } else {
    logger.warn({ kind }, 'Kind not captured');
  }

  logger.info({}, 'HandlePublicTransport:End');
  return feature;
}

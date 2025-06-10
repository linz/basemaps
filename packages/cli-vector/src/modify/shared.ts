import { LogType } from '@basemaps/shared';
import { Geometry, Position } from 'geojson';
import * as poly from 'polylabel';

import { VectorCreationOptions } from '../stac.js';
import { VectorGeoFeature } from '../types/VectorGeoFeature.js';
import { MajorHighWays } from './consts.js';

export const polylabel = poly.default as unknown as (
  polygon: number[][][],
  precision?: number,
  debug?: boolean,
) => number[];

export function handleRoadFeature(
  feature: VectorGeoFeature,
  options: VectorCreationOptions,
  logger: LogType,
): VectorGeoFeature {
  logger.trace({}, 'HandleRoadFeature:Start');
  feature = structuredClone(feature);

  const highwayNum = feature.properties['hway_num'];
  if (typeof highwayNum === 'string') {
    // append/override tags
    const kind = 'motorway';
    feature.properties['kind'] = kind;
    const ref = highwayNum;
    feature.properties['ref'] = ref;
    logger.trace({ kind, ref }, 'new/overidden tags');

    // override styles
    const minzoom = MajorHighWays.has(highwayNum) ? 2 : 8;
    feature.tippecanoe.minzoom = minzoom;
    logger.trace({ minzoom }, 'overidden styles');

    // return feature
    logger.trace({}, 'HandleRoadFeature:End');
    return feature;
  }

  const laneCount = feature.properties['lane_count'];
  if (typeof laneCount === 'number') {
    // append/override tags
    const kind = laneCount >= 4 ? 'primary' : 'secondary';
    feature.properties['kind'] = kind;
    logger.trace({ kind }, 'new/overidden tags');
  }

  // override styles
  if (options.layer.style.minZoom < 10) {
    const minzoom = 10;
    feature.tippecanoe.minzoom = minzoom;
    logger.trace({ minzoom }, 'overidden styles');
  }

  // return feature
  logger.trace({}, 'HandleRoadFeature:End');
  return feature;
}

export function getCoordinates(geometry: Geometry, logger: LogType): Position[][] {
  switch (geometry.type) {
    case 'MultiPolygon':
      // TODO: Worth to try create a point for each polygon and see how it looks line.
      return geometry.coordinates[0];
    case 'Polygon':
      return geometry.coordinates;
  }

  logger.error({ type: geometry.type }, 'Unsupported geometry type');
  throw new Error('Unsupported geometry type');
}

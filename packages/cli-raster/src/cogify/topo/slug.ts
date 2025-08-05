import { Epsg, EpsgCode } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';

import { MapSeries } from '../cli/cli.topo.js';

const Slugs: Partial<Record<number, Partial<Record<MapSeries, string>> | string>> = {
  // antarctic
  5479: 'antarctic',

  // new zealand
  [EpsgCode.Nztm2000]: 'new-zealand-mainland',
  [EpsgCode.Citm2000]: 'chatham-islands',

  // new zealand offshore islands
  3788: {
    topo25: 'snares-islands',
    topo50: 'auckland-islands',
  },
  3789: 'campbell-island',
  3790: 'antipodes-islands',
  3791: 'kermadec-islands',

  // pacific islands
  32702: {
    topo25: 'tokelau-islands',
    topo50: 'niue',
  },
  32703: {
    topo25: 'cook-islands-zone3',
    topo50: 'suwarrow',
  },
  32704: {
    topo25: 'cook-islands-zone4',
    topo50: 'penryn',
  },
};

/**
 * Attempts to map the given MapSeries and Epsg to a slug.
 *
 * @param mapSeries: The MapSeries to consider for Epsgs with multiple slug options
 * @param epsg: The Epsg to map to a slug
 *
 * @returns if succeeded, a slug string. Otherwise, null.
 */
export function mapEpsgToSlug(mapSeries: MapSeries, epsg: Epsg, logger?: LogType): string | null {
  const slug = Slugs[epsg.code];

  // no slug for the given EpsgCode enum
  if (slug == null) {
    logger?.info({ found: false }, 'mapEpsgToSlug()');
    return null;
  }

  // single option slug found for the given EpsgCode enum
  if (typeof slug === 'string') {
    logger?.info({ found: true }, 'mapEpsgToSlug()');
    return `${mapSeries}-${slug}`;
  }

  /**
   * for certain EpsgCode enums, we need to distinguish by map series
   */
  const slugByScale = slug[mapSeries];

  // no slug options for the given map series
  if (slugByScale == null) {
    logger?.info({ found: false }, 'mapEpsgToSlug()');
    return null;
  }

  // single option slug found for the given map series
  logger?.info({ found: true }, 'mapEpsgToSlug()');
  return `${mapSeries}-${slugByScale}`;
}

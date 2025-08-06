import { Epsg, EpsgCode } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';

import { MapSeries } from '../cli/cli.topo.js';

const Slugs: Record<MapSeries, Record<number, string>> = {
  topo25: {
    // new zealand offshore islands
    3788: 'snares-islands',
    3789: 'campbell-island',
    3790: 'antipodes-islands',
    3791: 'kermadec-islands',

    // pacific islands
    32702: 'tokelau-islands',
    32703: 'cook-islands-zone3',
    32704: 'cook-islands-zone4',
  },
  topo50: {
    // antarctic
    5479: 'antarctic',

    // new zealand
    [EpsgCode.Nztm2000]: 'new-zealand-mainland',
    [EpsgCode.Citm2000]: 'chatham-islands',

    // new zealand offshore islands
    3788: 'auckland-islands',

    // pacific islands
    32702: 'niue',
    32703: 'suwarrow',
    32704: 'penryn',
  },
  topo250: {
    // new zealand
    [EpsgCode.Nztm2000]: 'new-zealand-mainland',
    [EpsgCode.Citm2000]: 'chatham-islands',
  },
};

/**
 * Attempts to map the given MapSeries and Epsg to a slug.
 *
 * @param mapSeries - The MapSeries to consider for Epsgs with multiple slug options
 * @param epsg - The Epsg to map to a slug
 *
 * @returns if succeeded, a slug string. Otherwise, null.
 */
export function mapEpsgToSlug(mapSeries: MapSeries, epsg: Epsg, logger?: LogType): string | null {
  const slug = Slugs[mapSeries][epsg.code];

  // slug found for the given map series and Epsg code
  if (slug != null) {
    const result = `${mapSeries}-${slug}`;

    logger?.info({ found: true, slug: result }, 'mapEpsgToSlug()');
    return result;
  }

  // no slug for the given map series and Epsg code
  logger?.info({ found: false }, 'mapEpsgToSlug()');
  return null;
}

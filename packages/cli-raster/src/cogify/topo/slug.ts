import { EpsgCode } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';

const Slugs: Partial<Record<EpsgCode, string>> = {
  [EpsgCode.Nztm2000]: 'new-zealand-mainland',
  [EpsgCode.Citm2000]: 'chatham-islands',
};

/**
 * Attempts to map the given EpsgCode enum to a slug.
 *
 * @param epsg: The EpsgCode enum to map to a slug
 *
 * @returns if succeeded, a slug string. Otherwise, null.
 */
export function mapEpsgToSlug(epsg: EpsgCode, logger?: LogType): string | null {
  const slug = Slugs[epsg];

  logger?.info({ found: slug != null }, 'mapEpsgToSlug()');
  return slug ?? null;
}

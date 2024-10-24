import { Stac, StacProvider } from '@basemaps/geo';

export const copyright = `© ${Stac.License}`;

/**
 * Create a licensor attribution string.
 *
 * @param providers The optional list of providers.
 *
 * @returns A copyright string comprising the names of licensor providers.
 *
 * @example
 * "CC BY 4.0 LINZ"
 *
 * @example
 * "CC BY 4.0 Nelson City Council, Tasman District Council, Waka Kotahi"
 */
export function createLicensorAttribution(providers?: StacProvider[]): string {
  if (providers == null) return `${copyright} LINZ`;

  const licensors = providers.filter((p) => p.roles?.includes('licensor'));
  if (licensors.length === 0) return `${copyright} LINZ`;

  return `${copyright} ${licensors.map((l) => l.name).join(', ')}`;
}

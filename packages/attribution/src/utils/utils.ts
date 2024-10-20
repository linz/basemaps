import { BasemapsConfigProvider, ConfigTileSet } from '@basemaps/config';
import { Epsg, Stac, StacProvider } from '@basemaps/geo';

export const copyright = `© ${Stac.License}`;

/**
 * Construct a licensor attribution for a given tileSet.
 *
 * @param provider The BasemapsConfigProvider object.
 * @param tileSet The tileset from which to build the attribution.
 * @param projection The projection to consider.
 *
 * @returns A default attribution, if the tileset has more than one layer or no such imagery for the given projection exists.
 * Otherwise, a copyright string comprising the names of the tileset's licensors.
 *
 * @example
 * "CC BY 4.0 LINZ"
 *
 * @example
 * "CC BY 4.0 Nelson City Council, Tasman District Council, Waka Kotahi"
 */
export async function getTileSetAttribution(
  provider: BasemapsConfigProvider,
  tileSet: ConfigTileSet,
  projection: Epsg,
): Promise<string> {
  // ensure the tileset has exactly one layer
  if (tileSet.layers.length > 1 || tileSet.layers[0] === undefined) {
    return createLicensorAttribution();
  }

  // ensure imagery exist for the given projection
  const imgId = tileSet.layers[0][projection.code];
  if (imgId === undefined) return '';

  // attempt to load the imagery
  const imagery = await provider.Imagery.get(imgId);
  if (imagery == null || imagery.providers === undefined) {
    return createLicensorAttribution();
  }

  // return a licensor attribution string
  return createLicensorAttribution(imagery.providers);
}

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
  if (providers === undefined) return `${copyright} LINZ`;

  const licensors = providers.filter((p) => p.roles?.includes('licensor'));
  if (licensors.length === 0) return `${copyright} LINZ`;

  return `${copyright} ${licensors.map((l) => l.name).join(', ')}`;
}

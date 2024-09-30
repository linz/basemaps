import { BasemapsConfigProvider, getAllImagery } from '@basemaps/config';
import { Epsg } from '@basemaps/geo';
import { getPreviewUrl } from '@basemaps/shared';

/**
 * If a tileset layer of the given id and projection exists, this function returns a Basemaps URL
 * path that is already zoomed to the extent of the tileset. Otherwise, this function returns null.
 *
 * @param id - The id of the tileset.
 * @example "ashburton-2023-0.1m"
 *
 * @param projection - The projection from the tileset's layers to consider.
 * @example Epsg.Google = 3857
 */
export async function getTileSetPath(
  cfg: BasemapsConfigProvider,
  id: string,
  projection: Epsg,
): Promise<string | null> {
  const tileSet = await cfg.TileSet.get(id);
  if (!tileSet) return null;

  const imageryMap = await getAllImagery(cfg, tileSet.layers, [projection]);

  const imagery = [...imageryMap.values()][0];
  if (!imagery) return null;

  const url = getPreviewUrl({ imagery });

  return `${url.slug}?i=${url.name}`;
}

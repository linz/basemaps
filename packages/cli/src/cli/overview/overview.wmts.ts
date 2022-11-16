import { ConfigLayer, ConfigTileSetRaster, TileSetType } from '@basemaps/config';
import { ImageFormat, TileMatrixSet } from '@basemaps/geo';
import { WmtsCapabilities } from '@basemaps/lambda-tiler/build/wmts.capability.js';

export function createOverviewWmtsCapabilities(
  tileMatrix: TileMatrixSet,
  maxZoom: number,
  title = 'cotar-overviews',
): string {
  const fakeLayer: ConfigLayer = { [tileMatrix.projection.code]: '', title, name: 'cotar-overviews' };
  const tileSet: ConfigTileSetRaster = {
    id: 'cotar-overviews',
    name: 'cotar-overviews',
    type: TileSetType.Raster,
    format: ImageFormat.Webp,
    layers: [fakeLayer],
    title,
  };
  const wmts = new WmtsCapabilities({
    tileSet,
    tileMatrix: [tileMatrix],
    formats: [ImageFormat.Webp],
    httpBase: '',
    imagery: new Map(),
    isIndividualLayers: false,
  });

  wmts.maxZoom = maxZoom;

  const nodes = wmts.toVNode();

  const resourceUrl = nodes.find('ResourceURL');
  if (resourceUrl == null) throw new Error('Failed to create WMTSCapabilities missing resourceUrl');
  // Overwrite the location of the tiles to the structure used in the overview tar
  resourceUrl.attrs['template'] = '/tiles/{TileMatrix}/{TileCol}/{TileRow}.webp';
  return nodes.toString();
}

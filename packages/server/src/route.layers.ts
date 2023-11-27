import { BasemapsConfigProvider, ConfigImagery, getAllImagery, standardizeLayerName } from '@basemaps/config';
import { Epsg, GoogleTms, Projection, TileMatrixSets } from '@basemaps/geo';
import { V } from '@basemaps/shared';

const previewSize = { width: 1200, height: 630 };

// TODO this should be shared with all of the preview generation logic
function getImageryCenterZoom(im: ConfigImagery): { lat: number; lon: number; zoom: number } {
  const center = { x: im.bounds.x + im.bounds.width / 2, y: im.bounds.y + im.bounds.height / 2 };

  // Find a approximate GSD needed to show most of the imagery
  const aspectWidth = im.bounds.width / previewSize.width;
  const aspectHeight = im.bounds.height / previewSize.height;
  const bestAspect = Math.min(aspectHeight, aspectWidth);

  const tms = TileMatrixSets.find(im.tileMatrix);
  if (tms == null) throw new Error(`Failed to lookup tileMatrix: ${im.tileMatrix}`);
  const proj = Projection.get(tms);
  const centerLatLon = proj.toWgs84([center.x, center.y]);
  const targetZoom = Math.max(tms.findBestZoom(bestAspect) - 10, 0);
  return { lat: centerLatLon[1], lon: centerLatLon[0], zoom: targetZoom };
}

export function getPreviewUrl(im: ConfigImagery): {
  url: string;
  name: string;
  locationHash: string;
  location: { lat: number; lon: number; zoom: number };
} {
  const location = getImageryCenterZoom(im);
  const targetZoom = location.zoom;
  const lat = location.lat.toFixed(7);
  const lon = location.lon.toFixed(7);
  const locationHash = `@${lat},${lon},z${location.zoom}`;

  const name = standardizeLayerName(im.name);
  return {
    name,
    location,
    locationHash,
    url: `/v1/preview/${name}/${im.tileMatrix}/${targetZoom}/${lon}/${lat}`,
  };
}

export async function createLayersHtml(mem: BasemapsConfigProvider): Promise<string> {
  const allLayers = await mem.TileSet.get('ts_all');
  if (allLayers == null) return 'No layers found.';

  const allImagery = await getAllImagery(mem, allLayers.layers, [...Epsg.Codes.values()]);

  const cards = [];

  const layers = [...allImagery.values()].sort((a, b) => a.title.localeCompare(b.title));

  const showPreview = allImagery.size < 10;
  for (const img of layers) {
    let tileMatrix = TileMatrixSets.find(img.tileMatrix);
    if (tileMatrix == null) tileMatrix = GoogleTms;
    const ret = getPreviewUrl(img);

    const els = [
      V('div', { class: `layer-header`, style: 'display:flex; justify-content: space-around;' }, [
        V('div', { class: 'layer-title' }, img.title),
        V('div', { class: 'layer-tile-matrix' }, `TileMatrix: ${img.tileMatrix}`),
        V('div', { class: 'layer-tile-epsg' }, tileMatrix.projection.toEpsgString()),
      ]),
    ];

    if (showPreview) els.push(V('img', { width: '600px', height: '315px', src: ret.url }));
    cards.push(
      V(
        'a',
        { class: `layer layer-${img.id}`, href: `/?p=${tileMatrix.projection.code}&i=${ret.name}#${ret.locationHash}` },
        els,
      ),
    );
  }

  const style = `
body {
    font-family: 'Fira Sans', 'Open Sans';
}
.layer {
    margin: auto;
    margin-top: 32px;
    width: 600px;
    display: flex;
    flex-direction: column;
    padding: 16px;
    box-shadow: 0px 2px 3px 0px rgba(0,0,0,.2509803922), 0px 0px 3px 0px rgba(0,0,0,.1490196078);
}
.layer:hover {
    box-shadow: 0px 2px 3px 0px rgba(255,0,255,.2509803922), 0px 0px 3px 0px rgba(255,0,255,.1490196078);
    outline: 2px solid #FF00FF;
    cursor: pointer;
}
.layer-header {
    padding-bottom: 16px;
    display: flex;
    flex-direction: column;
    line-height: 1.5em;
}
.layer-title {
    font-weight: bold;
}
`;

  return V('html', [V('head', [V('style', '__STYLE_TEXT__')]), V('body', cards)])
    .toString()
    .replace('__STYLE_TEXT__', style); // CSS gets escaped be escaped
}

import { BasemapsConfigProvider, ConfigImagery, ConfigProviderMemory } from '@basemaps/config';
import { GoogleTms, TileMatrixSets } from '@basemaps/geo';
import { getPreviewUrl, V } from '@basemaps/shared';

async function getAllImagery(cfg: BasemapsConfigProvider): Promise<ConfigImagery[]> {
  const allImagery: ConfigImagery[] = [];

  if (ConfigProviderMemory.is(cfg)) {
    for (const obj of cfg.objects.values()) if (cfg.Imagery.is(obj)) allImagery.push(obj);
  }
  return Promise.resolve(allImagery);
}

export async function createLayersHtml(mem: BasemapsConfigProvider): Promise<string> {
  const allImagery = await getAllImagery(mem);
  if (allImagery.length === 0) return 'No imagery found';

  allImagery.sort((a, b) => a.title.localeCompare(b.title));
  const showPreview = allImagery.length < 10;
  const cards = [];
  for (const img of allImagery) {
    let tileMatrix = TileMatrixSets.find(img.tileMatrix);
    if (tileMatrix == null) tileMatrix = GoogleTms;

    const ts = ConfigProviderMemory.imageryToTileSet(img);

    for (const o of ts.outputs ?? []) {
      const ret = getPreviewUrl({ imagery: img, pipeline: o.name });

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
          {
            class: `layer layer-${img.id}`,
            href: `/${ret.slug}?tileMatrix=${tileMatrix.identifier}&style=${ret.name}&pipeline=${o.name}`,
          },
          els,
        ),
      );
    }
  }

  const style = `
body {
    font-family: 'Fira Sans', 'Open Sans';
}
.layer-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
}
.layer {
    width: 600px;
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
    line-height: 1.5rem;
}
.layer-title {
    font-weight: bold;
}
`;

  return V('html', [V('head', [V('style', '__STYLE_TEXT__')]), V('body', [V('div', { class: 'layer-grid' }, cards)])])
    .toString()
    .replace('__STYLE_TEXT__', style); // CSS gets escaped be escaped
}

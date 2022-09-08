import { Config } from './config.js';
import { MapOptionType, WindowUrl } from './url.js';
import { StyleSpecification } from 'maplibre-gl';
import { GoogleTms } from '@basemaps/geo';
import { projectGeoJson } from './tile.matrix.js';
import { ConfigImagery } from '@basemaps/config/src/config/imagery.js';
import { ConfigData } from './config.layer.js';

export class DebugMap {
  _layerLoading: Map<string, Promise<void>> = new Map();
  loadSourceLayer(map: maplibregl.Map, layerId: string, imagery: ConfigImagery, type: 'source' | 'cog'): Promise<void> {
    const layerKey = `${layerId}-${type}`;
    let existing = this._layerLoading.get(layerKey);
    if (existing == null) {
      existing = this._loadSourceLayer(map, layerId, imagery, type);
      this._layerLoading.set(layerKey, existing);
    }
    return existing;
  }

  async _loadSourceLayer(
    map: maplibregl.Map,
    layerId: string,
    imagery: ConfigImagery,
    type: 'source' | 'cog',
  ): Promise<void> {
    const sourceId = `${layerId}_${type}`;
    const layerFillId = `${sourceId}_fill`;
    if (map.getLayer(layerFillId) != null) return;

    const sourceUri = WindowUrl.toImageryUrl(imagery.id, type === 'source' ? 'source.geojson' : 'covering.geojson');

    const res = await fetch(sourceUri);
    let data;
    if (res.ok) {
      data = await res.json();
    } else {
      data = ConfigData.getGeoJson(imagery);
    }
    if (Config.map.tileMatrix.projection !== GoogleTms.projection) projectGeoJson(data, Config.map.tileMatrix);

    let id = 0;
    // Ensure there is a id on each feature
    for (const f of data.features) f.id = id++;

    map.addSource(sourceId, { type: 'geojson', data });
  }

  _styleJson: Promise<StyleSpecification> | null = null;
  get styleJson(): Promise<StyleSpecification> {
    if (this._styleJson == null) {
      this._styleJson = fetch(
        WindowUrl.toTileUrl(MapOptionType.Style, Config.map.tileMatrix, 'topographic', 'topographic', null),
      ).then((f) => f.json());
    }
    return this._styleJson;
  }

  adjustTopographic = (e: Event): void => {
    const slider = e.target as HTMLInputElement;
    Config.map.setDebug('debug.layer.linz-topographic', Number(slider.value));
  };

  async adjustVector(map: maplibregl.Map, value: number): Promise<void> {
    const styleJson = await this.styleJson;

    const hasTopographic = map.getSource('LINZ Basemaps');
    if (hasTopographic == null) {
      if (value === 0) return; // Going to remove it anyway so just abort early
      const source = styleJson.sources?.['LINZ Basemaps'];
      if (source == null) return;
      map.addSource('LINZ Basemaps', source);
      map.setStyle({ ...map.getStyle(), glyphs: styleJson.glyphs, sprite: styleJson.sprite });
      // Setting glyphs/sprites forces a full map refresh, wait for the refresh before adjusting the style
      map.once('style.load', () => this.adjustVector(map, value));
      return;
    }

    const layers = styleJson.layers?.filter((f) => f.type !== 'background' && f.source === 'LINZ Basemaps') ?? [];

    // Do not hide topographic layers when trying to inspect the topographic layer
    if (Config.map.layerId === 'topographic') return;
    // Force all the layers to be invisible to start, otherwise the map will "flash" on then off
    for (const layer of layers) {
      const paint = (layer.paint ?? {}) as Record<string, unknown>;
      if (layer.type === 'symbol') {
        paint['icon-opacity'] = 0;
        paint['text-opacity'] = 0;
      } else {
        paint[`${layer.type}-opacity`] = 0;
      }
      layer.paint = paint;
    }

    if (value === 0) {
      for (const layer of layers) {
        if (map.getLayer(layer.id) == null) continue;
        map.removeLayer(layer.id);
      }
      return;
    }

    // Ensure all the layers are loaded before styling
    if (map.getLayer(layers[0].id) == null) {
      if (value === 0) return;
      for (const layer of layers) map.addLayer(layer);
    }

    for (const layer of layers) {
      if (map.getLayer(layer.id) == null) continue;
      if (layer.type === 'symbol') {
        map.setPaintProperty(layer.id, `icon-opacity`, value);
        map.setPaintProperty(layer.id, `text-opacity`, value);
      } else {
        map.setPaintProperty(layer.id, `${layer.type}-opacity`, value);
      }
    }
  }

  adjustOsm = (e: Event): void => {
    Config.map.setDebug('debug.layer.osm', Number((e.target as HTMLInputElement).value));
  };
  adjustLinzAerial = (e: Event): void => {
    Config.map.setDebug('debug.layer.linz-aerial', Number((e.target as HTMLInputElement).value));
  };

  adjustRaster(map: maplibregl.Map, rasterId: 'osm' | 'linz-aerial', range: number): void {
    if (map.getSource(rasterId) == null) {
      map.addSource(rasterId, {
        type: 'raster',
        tiles: [this.getTileServerUrl(rasterId)],
        tileSize: 256,
      });
    }

    const isLayerMissing = map.getLayer(rasterId) == null;
    if (range === 0) {
      if (!isLayerMissing) map.removeLayer(rasterId);
      return;
    }

    if (isLayerMissing) {
      map.addLayer({
        id: rasterId,
        type: 'raster',
        source: rasterId,
        minzoom: 0,
        maxzoom: 24,
        paint: { 'raster-opacity': 0 },
      });

      // Ensure this raster layers are below the vector layer
      const sourceLayerId = `${Config.map.layerId}_source_fill`;
      const isSourceLayerEnabled = map.getLayer(sourceLayerId) != null;
      if (isSourceLayerEnabled) {
        map.moveLayer(rasterId, sourceLayerId);
      }
    }
    map.setPaintProperty(rasterId, 'raster-opacity', range);
  }

  togglePurple = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    this.setPurple(target.checked);
  };

  setPurple(isPurple: boolean): void {
    Config.map.setDebug('debug.background', isPurple ? 'magenta' : false);
    if (isPurple) document.body.style.backgroundColor = 'magenta';
    else document.body.style.backgroundColor = '';
  }

  getTileServerUrl(tileServer: 'osm' | 'linz-aerial'): string {
    if (tileServer === 'osm') return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    if (tileServer === 'linz-aerial') {
      return WindowUrl.toTileUrl(MapOptionType.TileRaster, Config.map.tileMatrix, 'aerial', undefined, null);
    }

    throw new Error('Unknown tile server');
  }
}

import { ConfigImagery } from '@basemaps/config/build/config/imagery.js';
import { GoogleTms, projectGeoJson } from '@basemaps/geo';
import { BBoxFeature } from '@linzjs/geojson';
import { BBoxFeatureCollection } from '@linzjs/geojson/build/types.js';
import { StyleSpecification } from 'maplibre-gl';
import { FormEventHandler } from 'react';

import { Config } from './config.js';
import { ConfigData } from './config.layer.js';
import { MapOptionType, WindowUrl } from './url.js';

export interface DebugType {
  name: string;
  file: string;
  color: string;
  fill: boolean;
}

interface StyleSpecificationPrefix extends StyleSpecification {
  /** random prefix applied to layers and sources */
  prefix: string;
}

export const debugTypes = {
  source: {
    name: 'source',
    file: 'source.geojson',
    color: '#ff00ff',
    fill: true,
  },
  cog: {
    name: 'cog',
    file: 'covering.geojson',
    color: '#ff0000',
    fill: true,
  },
  'capture-area': {
    name: 'capture-area',
    file: 'capture-area.geojson',
    color: '#FF7500',
    fill: false,
  },
};

/**
 * Attempt to create a unique prefix for the style to allow multiple debug maps to be shown on the same map without conflicts in source/layer names. This is done by prefixing all source and layer names with a random string.
 * @param inputStyle
 * @returns
 */
function prefixStyleJson(inputStyle: StyleSpecification): StyleSpecificationPrefix {
  const outputStyle = structuredClone(inputStyle) as StyleSpecificationPrefix;
  const prefix = Math.random().toString(16).slice(2, 8);
  outputStyle.prefix = prefix;
  outputStyle.sources = {};
  for (const [key, val] of Object.entries(inputStyle.sources)) {
    outputStyle.sources[`${prefix}__${key}`] = val;
  }

  for (const layer of outputStyle.layers) {
    layer.id = `${prefix}__${layer.id}`;
    if (layer.type === 'background') continue;
    layer.source = `${prefix}__${layer.source}`;
  }

  return outputStyle;
}

export class DebugMap {
  _layerLoading: Map<string, Promise<void>> = new Map();
  loadSourceLayer(map: maplibregl.Map, layerId: string, imagery: ConfigImagery, type: DebugType): Promise<void> {
    const layerKey = `${layerId}-${type.name}`;
    let existing = this._layerLoading.get(layerKey);
    if (existing == null) {
      existing = this._loadSourceLayer(map, layerId, imagery, type);
      this._layerLoading.set(layerKey, existing);
    }
    return existing;
  }

  async _loadSourceLayer(map: maplibregl.Map, layerId: string, imagery: ConfigImagery, type: DebugType): Promise<void> {
    const sourceId = `${layerId}_${type.name}`;
    const layerFillId = `${sourceId}_fill`;
    if (map.getLayer(layerFillId) != null) return;

    let data = await this.fetchSourceLayer(imagery.id, type);
    if (data == null && type.name === 'source') {
      data = ConfigData.getGeoJson(imagery);
    }

    if (data == null) return;

    if (Config.map.tileMatrix.projection !== GoogleTms.projection) projectGeoJson(data, Config.map.tileMatrix);

    let id = 0;
    // Ensure there is a id on each feature
    if (data.type === 'Feature') {
      data.id = id;
    } else if (data.type === 'FeatureCollection') {
      for (const f of data.features) f.id = id++;
    }

    map.addSource(sourceId, { type: 'geojson', data });
  }

  _source: Map<string, Promise<BBoxFeatureCollection | BBoxFeature>> = new Map();
  async fetchSourceLayer(imageryId: string, type: DebugType): Promise<BBoxFeatureCollection | BBoxFeature | undefined> {
    const id = `${imageryId}_${type.name}`;
    let existing = this._source.get(id);
    if (existing == null) {
      const sourceUri = WindowUrl.toImageryUrl(imageryId, type.file);
      existing = fetch(sourceUri).then((r) => {
        if (r.ok) return r.json();
        return;
      });

      this._source.set(id, existing);
    }
    return existing;
  }

  _styleJson: Map<string, Promise<StyleSpecificationPrefix>> = new Map();
  get styleJson(): Promise<StyleSpecificationPrefix> {
    const style = this._styleJson.get(Config.map.tileMatrix.identifier);
    if (style != null) return style;
    const promise = fetch(
      WindowUrl.toTileUrl({
        urlType: MapOptionType.Style,
        tileMatrix: Config.map.tileMatrix,
        layerId: 'topographic-v2',
        style: 'labels-v2',
      }),
    )
      .then((f) => f.json() as Promise<StyleSpecificationPrefix>)
      .then((style) => prefixStyleJson(style));
    this._styleJson.set(Config.map.tileMatrix.identifier, promise);
    return promise;
  }

  async adjustVector(map: maplibregl.Map, value: number): Promise<void> {
    const styleJson = await this.styleJson;
    const layers = styleJson.layers?.filter((f) => f.type !== 'background') ?? [];

    // Remove layers if opacity is set to zero
    if (value === 0) {
      for (const layer of layers) {
        if (map.getLayer(layer.id) == null) continue;
        map.removeLayer(layer.id);
      }
      for (const key of Object.keys(styleJson.sources)) {
        if (map.getSource(key) == null) continue;
        map.removeSource(key);
      }
      return;
    }

    let newSource = false;
    for (const key of Object.keys(styleJson.sources)) {
      if (map.getSource(key) == null) newSource = true;
    }
    for (const layer of layers) {
      if (map.getLayer(layer.id) == null) newSource = true;
    }

    if (newSource) {
      const currentStyle = map.getStyle();
      map.setStyle({
        ...currentStyle,
        sources: { ...currentStyle.sources, ...styleJson.sources },
        glyphs: styleJson.glyphs,
        sprite: styleJson.sprite,
        layers: [...currentStyle.layers, ...layers],
      });
    }

    for (const layer of layers) {
      if (map.getLayer(layer.id) == null) continue;
      const paint = layer.paint as Record<string, unknown>;
      if (layer.type === 'symbol') {
        map.setPaintProperty(layer.id, `icon-opacity`, scaleOpacityProperty(paint, 'icon-opacity', value));
        map.setPaintProperty(layer.id, `text-opacity`, scaleOpacityProperty(paint, 'text-opacity', value));
      } else {
        map.setPaintProperty(
          layer.id,
          `${layer.type}-opacity`,
          scaleOpacityProperty(paint, `${layer.type}-opacity`, value),
        );
      }
    }
  }

  adjustTopographicLabels: FormEventHandler = (e) => {
    Config.map.setDebug('debug.layer.linz-labels', Number((e.target as HTMLInputElement).value));
  };
  adjustOsm: FormEventHandler = (e) => {
    Config.map.setDebug('debug.layer.osm', Number((e.target as HTMLInputElement).value));
  };
  adjustLinzAerial: FormEventHandler = (e) => {
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

  togglePurple: FormEventHandler = (e) => {
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
      return WindowUrl.toTileUrl({
        urlType: MapOptionType.TileRaster,
        tileMatrix: Config.map.tileMatrix,
        layerId: 'aerial',
      });
    }

    throw new Error('Unknown tile server');
  }
}

/**
 * Attempt to scale a opacity property
 * Which is generally either a number 0-1 or a list of stops eg `[[0, 1], [10, 0.5]]`
 */
function scaleOpacityProperty(
  obj: Record<string, unknown> | undefined,
  property: string,
  value: number,
): number | { stops: [number, number][] } {
  const current = obj?.[property] ?? 1;

  if (typeof current === 'number') return current * value;
  if (typeof current !== 'object') return value;
  if (Array.isArray(current)) return value;

  if ('stops' in current) return { stops: (current.stops as [number, number][]).map((s) => [s[0], s[1] * value]) };
  return value;
}

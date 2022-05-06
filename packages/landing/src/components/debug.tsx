import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';
import maplibre, { AnyLayer, Style } from 'maplibre-gl';
import { Component, ComponentChild, Fragment } from 'preact';
import { Config } from '../config.js';
import { MapConfig } from '../config.map.js';
import { MapOptionType, WindowUrl } from '../url.js';

function debugSlider(
  label: 'osm' | 'linz-topographic' | 'linz-aerial',
  onInput: (e: Event) => unknown,
): ComponentChild {
  return (
    <input
      className="debug__slider"
      type="range"
      min="0"
      max="1"
      step="0.05"
      value={String(Config.map.debug[`debug.layer.${label}`])}
      onInput={onInput}
    />
  );
}

export class Debug extends Component<{ map: maplibre.Map }, { lastFeatureId: string | number | undefined }> {
  componentDidMount(): void {
    this.waitForMap();
  }

  waitForMap = (): void => {
    if (this.props.map == null) {
      setTimeout(this.waitForMap, 20);
      return;
    }
    this.props.map.resize();
    this.props.map.once('load', () => {
      Config.map.on('change', () => {
        if (this.props.map == null) return;
        const locationHash = WindowUrl.toHash(Config.map.getLocation(this.props.map));
        const locationSearch = '?' + MapConfig.toUrl(Config.map);
        window.history.replaceState(null, '', locationSearch + locationHash);
        this.updateFromConfig();
      });
      this.updateFromConfig();
    });
  };

  updateFromConfig(): void {
    this.setPurple(Config.map.debug['debug.background'] === 'magenta');
    this.adjustRaster('osm', Config.map.debug['debug.layer.osm']);
    this.adjustRaster('linz-aerial', Config.map.debug['debug.layer.linz-aerial']);
    this.adjustVector(Config.map.debug['debug.layer.linz-topographic']);
  }

  render(): ComponentChild {
    return (
      <div className="debug">
        <div className="debug__info">
          <label className="debug__label">ImageId</label>
          <div className="debug__value">{Config.map.layerId}</div>
        </div>
        <div className="debug__info">
          <label className="debug__label">Projection </label>
          <div className="debug__value">{Config.map.tileMatrix.projection.toEpsgString()}</div>
        </div>
        <div className="debug__info">
          <label className="debug__label">TileMatrix </label>
          <div className="debug__value">{Config.map.tileMatrix.identifier}</div>
        </div>
        {this.renderSliders()}
        <div className="debug__info">
          <label className="debug__label">Purple</label>
          <input
            type="checkbox"
            onClick={this.togglePurple}
            checked={Config.map.debug['debug.background'] === 'magenta'}
          />
        </div>
        {this.renderSourceToggle()}
      </div>
    );
  }

  renderSourceToggle(): ComponentChild {
    // TODO this is a nasty hack to detect if a direct imageryId is being viewed
    if (!Config.map.layerId.startsWith('01')) return null;
    if (Config.map.tileMatrix.projection === Nztm2000QuadTms.projection) return null;

    return (
      <Fragment>
        <div className="debug__info">
          <label className="debug__label">Source</label>
          <input type="checkbox" onClick={this.toggleSource} />
        </div>
        {this.state.lastFeatureId == null ? null : (
          <div className="debug__info" title={String(this.state.lastFeatureId)}>
            <label className="debug__label">SourceId</label>
            {String(this.state.lastFeatureId).split('/').pop()}
          </div>
        )}
      </Fragment>
    );
  }

  /** Show the source bounding box ont he map */
  toggleSource = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    Config.map.setDebug('debug.source', target.checked);
    this.setSourceShown(target.checked);
  };

  setSourceShown(isShown: boolean): void {
    const map = this.props.map;
    const sourceId = Config.map.layerId + '_source';
    const layerFillId = sourceId + '_fill';
    const layerLineId = sourceId + '_line';
    const sourceUri = WindowUrl.toImageryUrl('im_' + Config.map.layerId, 'source.geojson');
    if (isShown) {
      if (map.getSource(sourceId) == null) map.addSource(sourceId, { type: 'geojson', data: sourceUri });
      if (map.getLayer(layerFillId) != null) return;

      let lastFeatureId: string | number | undefined;
      map.on('mousemove', layerFillId, (e) => {
        const features = e.features;
        if (features == null || features.length === 0) return;
        const firstFeature = features[0];

        if (firstFeature.id == null) firstFeature.id = firstFeature.properties?.['name'];
        const nextFeatureId = firstFeature.id;
        if (nextFeatureId == null) return;

        lastFeatureId = features[0].id;
        this.setState({ ...this.state, lastFeatureId });
      });
      map.on('mouseleave', layerFillId, () => {
        if (lastFeatureId == null) return;
        lastFeatureId = undefined;
        this.setState({ ...this.state, lastFeatureId });
      });
      // Fill is needed to make the mouse move work even though it has opacity 0
      map.addLayer({ id: layerFillId, type: 'fill', source: sourceId, paint: { 'fill-opacity': 0 } });
      map.addLayer({
        id: layerLineId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': 'rgb(255,50,100)',
          'line-opacity': 0.5,
          'line-width': 1,
        },
      });
    } else {
      if (map.getLayer(layerFillId) != null) {
        map.removeLayer(layerFillId);
        map.removeLayer(layerLineId);
      }
    }
  }

  renderSliders(): ComponentChild | null {
    // Only 3857 currently works with OSM/Topographic map
    if (Config.map.tileMatrix.identifier !== GoogleTms.identifier) {
      return (
        <div className="debug__info">
          <label className="debug__label">LINZ Aerial</label>
          {debugSlider('linz-aerial', this.adjustLinzAerial)}
        </div>
      );
    }

    return (
      <Fragment>
        <div className="debug__info">
          <label className="debug__label">OSM</label>
          {debugSlider('osm', this.adjustOsm)}
        </div>
        <div className="debug__info">
          <label className="debug__label">Topographic</label>
          {debugSlider('linz-topographic', this.adjustTopographic)}
        </div>
        <div className="debug__info">
          <label className="debug__label">LINZ Aerial</label>
          {debugSlider('linz-aerial', this.adjustLinzAerial)}
        </div>
      </Fragment>
    );
  }

  _styleJson: Promise<Style> | null = null;
  get styleJson(): Promise<Style> {
    if (this._styleJson == null) {
      this._styleJson = fetch(
        WindowUrl.toTileUrl(MapOptionType.TileVectorStyle, Config.map.tileMatrix, 'topographic', 'topographic'),
      ).then((f) => f.json());
    }
    return this._styleJson;
  }

  adjustTopographic = (e: Event): void => {
    const slider = e.target as HTMLInputElement;
    Config.map.setDebug('debug.layer.linz-topographic', Number(slider.value));
  };

  async adjustVector(value: number): Promise<void> {
    const styleJson = await this.styleJson;
    const map = this.props.map;

    const hasTopographic = map.getSource('LINZ Basemaps');
    if (hasTopographic == null) {
      if (value === 0) return; // Going to remove it anyway so just abort early
      const source = styleJson.sources?.['LINZ Basemaps'];
      if (source == null) return;
      map.addSource('LINZ Basemaps', source);
      map.setStyle({ ...map.getStyle(), glyphs: styleJson.glyphs, sprite: styleJson.sprite });
      // Setting glyphs/sprites forces a full map refresh, wait for the refresh before adjusting the style
      map.once('style.load', () => this.adjustVector(value));
      return;
    }

    const layers = styleJson.layers?.filter((f) => f.type !== 'custom' && f.source === 'LINZ Basemaps') ?? [];

    // Force all the layers to be invisible to start, otherwise the map will "flash" on then off
    for (const layer of layers) {
      if (layer.type === 'custom') continue;
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
      for (const layer of layers) map.addLayer(layer as AnyLayer);
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

  adjustRaster(rasterId: 'osm' | 'linz-aerial', range: number): void {
    // Config.map.setDebug(`debug-layer-${rasterId}`, range);
    if (this.props.map.getSource(rasterId) == null) {
      this.props.map.addSource(rasterId, {
        type: 'raster',
        tiles: [getTileServerUrl(rasterId)],
        tileSize: 256,
      });
    }

    const isLayerMissing = this.props.map.getLayer(rasterId) == null;
    if (range === 0) {
      if (!isLayerMissing) this.props.map.removeLayer(rasterId);
      return;
    }

    if (isLayerMissing) {
      this.props.map.addLayer({
        id: rasterId,
        type: 'raster',
        source: rasterId,
        minzoom: 0,
        maxzoom: 24,
        paint: { 'raster-opacity': 0 },
      });
    }
    this.props.map.setPaintProperty(rasterId, 'raster-opacity', range);
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
}

export function getTileServerUrl(tileServer: 'osm' | 'linz-aerial'): string {
  if (tileServer === 'osm') return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  if (tileServer === 'linz-aerial') {
    return WindowUrl.toTileUrl(MapOptionType.TileRaster, Config.map.tileMatrix, 'aerial');
  }

  throw new Error('Unknown tile server');
}

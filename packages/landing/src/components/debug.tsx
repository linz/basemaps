import { ConfigImagery } from '@basemaps/config/src/config/imagery.js';
import { ConfigTileSetRaster } from '@basemaps/config/src/config/tile.set.js';
import { GoogleTms, TileMatrixSets } from '@basemaps/geo';
import { Projection } from '@basemaps/shared/src/proj/projection.js';
import { BBoxFeatureCollection } from '@linzjs/geojson';
import { GeoJSONFeature, StyleSpecification } from 'maplibre-gl';
import { Component, ComponentChild, Fragment } from 'preact';
import { ConfigData } from '../config.data.js';
import { Config } from '../config.js';
import { MapConfig } from '../config.map.js';
import { projectGeoJson } from '../tile.matrix.js';
import { MapOptionType, WindowUrl } from '../url.js';
import { onMapLoaded } from './map.js';

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

export class Debug extends Component<
  { map: maplibregl.Map },
  {
    featureCogId: string | number | undefined;
    featureCogName: string | undefined;
    featureSourceId: string | number | undefined;
    featureSourceName: string | undefined;
    tileSetId: string | null;
    tileSet: ConfigTileSetRaster | null;
    imageryId: string | null;
    imagery: ConfigImagery | null;
  }
> {
  componentDidMount(): void {
    this.waitForMap();
  }

  waitForMap = (): void => {
    const map = this.props.map;
    if (map == null) {
      setTimeout(this.waitForMap, 20);
      return;
    }

    (window as any).MaplibreMap = map;

    map.resize();
    onMapLoaded(map, () => {
      Config.map.on('change', () => {
        if (this.props.map == null) return;

        const locationHash = WindowUrl.toHash(Config.map.getLocation(this.props.map));
        const locationSearch = '?' + MapConfig.toUrl(Config.map);
        window.history.replaceState(null, '', locationSearch + locationHash);
        this.updateFromConfig();
      });
      this.updateFromConfig();
      if (Config.map.debug['debug.screenshot']) {
        map.once('idle', () => {
          // Jam a div into the page once the map has loaded so tools like playwright can see the map has finished loading
          const loadedDiv = document.createElement('div');
          loadedDiv.id = 'map-loaded';
          loadedDiv.style.width = '1px';
          loadedDiv.style.height = '1px';
          document.body.appendChild(loadedDiv);
        });
      }
    });
  };

  updateFromConfig(): void {
    console.log('updateFromConfig');
    this.setPurple(Config.map.debug['debug.background'] === 'magenta');
    this.adjustRaster('osm', Config.map.debug['debug.layer.osm']);
    this.adjustRaster('linz-aerial', Config.map.debug['debug.layer.linz-aerial']);
    this.adjustVector(Config.map.debug['debug.layer.linz-topographic']);
    this.setVectorShown(Config.map.debug['debug.source'], 'source');
    this.setVectorShown(Config.map.debug['debug.cog'], 'cog');

    if (this.state.tileSetId !== Config.map.layerId) {
      this._loadingTileSet = this._loadingTileSet.then(() => this.loadTileSetConfig());
    }
  }

  _loadingTileSet: Promise<void> = Promise.resolve();
  async loadTileSetConfig(): Promise<void> {
    const tileSetId = Config.map.layerId;
    if (this.state.tileSet?.id === tileSetId) return;
    return ConfigData.getTileSet(tileSetId).then((tileSet) => {
      if (this.state.tileSetId === tileSet?.id) return;
      this.setState({ ...this.state, tileSet, tileSetId, imageryId: null });

      if (tileSet == null) return;
      if (tileSet.layers.length !== 1) return;

      const projectionCode = Config.map.tileMatrix.projection.code;
      const imageryId = tileSet.layers[0][projectionCode];
      if (imageryId == null) return;

      return ConfigData.getImagery(tileSetId, imageryId).then((imagery) => {
        this.setState({ ...this.state, tileSetId, imagery, imageryId: imagery?.id }, () => this.updateFromConfig());
      });
    });
  }

  render(): ComponentChild {
    if (Config.map.debug['debug.screenshot']) return null;
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
        {this.renderImageryInfo()}
        {this.renderSliders()}
        {this.renderPurple()}
        {this.renderCogToggle()}
        {this.renderSourceToggle()}
      </div>
    );
  }

  renderImageryInfo(): ComponentChild | null {
    if (this.state.imagery == null) return null;
    return (
      <div className="debug__info">
        <label className="debug__label">Imagery </label>
        <div className="debug__value">{this.state.imagery.id}</div>
      </div>
    );
  }

  renderPurple(): ComponentChild | null {
    if (Config.map.debug['debug.screenshot']) return;
    return (
      <div className="debug__info">
        <label className="debug__label">Purple</label>
        <input
          type="checkbox"
          onClick={this.togglePurple}
          checked={Config.map.debug['debug.background'] === 'magenta'}
        />
      </div>
    );
  }

  renderCogToggle(): ComponentChild {
    if (this.state.imagery == null) return null;

    return (
      <Fragment>
        <div className="debug__info">
          <label className="debug__label">
            {/* <a href={cogLocation} title="Source geojson"> */}
            Cogs
            {/* </a> */}
          </label>
          <input type="checkbox" onClick={this.toggleCogs} checked={Config.map.debug['debug.cog']} />
        </div>
        {/* {this.state.featureSourceId == null ? null : ( */}
        <div className="debug__info" title={String(this.state.featureCogName)}>
          <label className="debug__label">CogId</label>
          {String(this.state.featureCogName).split('/').pop()}
        </div>
        {/* )} */}
      </Fragment>
    );
  }

  renderSourceToggle(): ComponentChild {
    // TODO this is a nasty hack to detect if a direct imageryId is being viewed
    if (!Config.map.layerId.startsWith('01')) return null;
    const sourceLocation = WindowUrl.toImageryUrl(`im_${Config.map.layerId}`, 'source.geojson');
    return (
      <Fragment>
        <div className="debug__info">
          <label className="debug__label">
            <a href={sourceLocation} title="Source geojson">
              Source
            </a>
          </label>
          <input type="checkbox" onClick={this.toggleSource} checked={Config.map.debug['debug.source']} />
        </div>
        {this.state.featureSourceId == null ? null : (
          <div className="debug__info" title={String(this.state.featureSourceName)}>
            <label className="debug__label">SourceId</label>
            {String(this.state.featureSourceName).split('/').pop()}
          </div>
        )}
      </Fragment>
    );
  }

  /** Show the source bounding box ont he map */
  toggleCogs = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    Config.map.setDebug('debug.cog', target.checked);
    this.setVectorShown(target.checked, 'config');
  };

  /** Show the source bounding box ont he map */
  toggleSource = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    Config.map.setDebug('debug.source', target.checked);
    this.setVectorShown(target.checked, 'source');
  };

  trackMouseMove(layerId: string, type: 'source' | 'cog' | 'config'): void {
    const sourceId = `${layerId}_${type}`;
    const layerFillId = `${sourceId}_fill`;
    const map = this.props.map;

    let lastFeatureId: string | number | undefined;
    const stateName = type === 'source' ? `featureSource` : `featureCog`;
    map.on('mousemove', layerFillId, (e) => {
      const features = e.features;
      if (features == null || features.length === 0) return;
      const firstFeature = features[0];
      if (firstFeature.id === lastFeatureId) return;
      if (lastFeatureId != null) map.setFeatureState({ source: sourceId, id: lastFeatureId }, { hover: false });

      lastFeatureId = firstFeature.id;
      this.setState({
        ...this.state,
        [`${stateName}Id`]: lastFeatureId,
        [`${stateName}Name`]: firstFeature.properties?.['name'],
      });
      map.setFeatureState({ source: sourceId, id: lastFeatureId }, { hover: true });
    });
    map.on('mouseleave', layerFillId, () => {
      if (lastFeatureId == null) return;
      map.setFeatureState({ source: sourceId, id: lastFeatureId }, { hover: false });

      lastFeatureId = undefined;
      this.setState({ ...this.state, [`${stateName}Id`]: undefined, [`${stateName}Name`]: undefined });
    });
  }

  setVectorShown(isShown: boolean, type: 'source' | 'cog' | 'config'): void {
    if (type === 'cog' && this.state.imagery == null) return;

    console.log('setVectorShown', this.state.imagery);
    const map = this.props.map;

    const layerId = Config.map.layerId;
    const sourceId = `${layerId}_${type}`;
    const layerFillId = `${sourceId}_fill`;
    const layerLineId = `${sourceId}_line`;
    if (isShown === false) {
      if (map.getLayer(layerFillId) == null) return;
      map.removeLayer(layerFillId);
      map.removeLayer(layerLineId);
      return;
    }

    if (map.getLayer(layerLineId) != null) return;

    const color = type === 'source' ? '#ff00ff' : '#ff0000';

    this.loadSourceLayer(layerId, type).then(() => {
      if (map.getLayer(layerLineId) != null) return;

      // Fill is needed to make the mouse move work even though it has opacity 0
      map.addLayer({
        id: layerFillId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.25, 0],
          'fill-color': color,
        },
      });
      this.trackMouseMove(layerId, type);

      map.addLayer({
        id: layerLineId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': color,
          'line-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 1, 0.5],
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 1],
        },
      });
    });
  }

  _layerLoading: Map<string, Promise<void>> = new Map();
  loadSourceLayer(layerId: string, type: 'source' | 'cog' | 'config'): Promise<void> {
    const layerKey = `${layerId}-${type}`;

    let existing = this._layerLoading.get(layerKey);
    if (existing == null) {
      existing = this._loadSourceLayer(layerId, type);
      this._layerLoading.set(layerKey, existing);
    }
    return existing;
  }

  async _loadSourceLayer(layerId: string, type: 'source' | 'cog' | 'config'): Promise<void> {
    const map = this.props.map;

    const sourceId = `${layerId}_${type}`;
    const layerFillId = `${sourceId}_fill`;
    if (map.getLayer(layerFillId) != null) return;

    const data = await fetchGeoJson(layerId, type, this.state.imagery);
    if (data == null) return;
    console.log(data);

    if (Config.map.tileMatrix.projection !== GoogleTms.projection) projectGeoJson(data, Config.map.tileMatrix);

    let id = 0;
    // Ensure there is a id on each feature
    for (const f of data.features) f.id = id++;

    map.addSource(sourceId, { type: 'geojson', data });
  }

  renderSliders(): ComponentChild | null {
    // Disable the sliders for screenshots
    if (Config.map.debug['debug.screenshot']) return;
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

  adjustRaster(rasterId: 'osm' | 'linz-aerial', range: number): void {
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

      // Ensure this raster layers are below the vector layer
      const sourceLayerId = `${Config.map.layerId}_source_fill`;
      const isSourceLayerEnabled = this.props.map.getLayer(sourceLayerId) != null;
      if (isSourceLayerEnabled) {
        this.props.map.moveLayer(rasterId, sourceLayerId);
      }
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
    return WindowUrl.toTileUrl(MapOptionType.TileRaster, Config.map.tileMatrix, 'aerial', undefined, null);
  }

  throw new Error('Unknown tile server');
}

async function fetchGeoJson(
  layerId: string,
  type: 'source' | 'cog' | 'config',
  imagery: ConfigImagery | null,
): Promise<BBoxFeatureCollection | void> {
  if (type === 'cog') {
    if (imagery == null) return;
    const tileMatrix = TileMatrixSets.find(imagery.tileMatrix);
    if (tileMatrix == null) return;
    return Projection.get(tileMatrix).toGeoJson(imagery.files);
  }

  const sourceUri = WindowUrl.toImageryUrl(`im_${layerId}`, type === 'source' ? 'source.geojson' : 'covering.geojson');

  const res = await fetch(sourceUri);
  if (!res.ok) return;

  const data: BBoxFeatureCollection = await res.json();
  return data;
}

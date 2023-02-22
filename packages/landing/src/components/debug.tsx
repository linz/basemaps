import { ConfigImagery } from '@basemaps/config/build/config/imagery.js';
import { ConfigTileSetRaster } from '@basemaps/config/build/config/tile.set.js';
import { GoogleTms } from '@basemaps/geo';
import { ChangeEventHandler, Component, FormEventHandler, Fragment, ReactNode } from 'react';
import { Attributions } from '../attribution.js';
import { Config } from '../config.js';
import { ConfigData } from '../config.layer.js';
import { MapConfig } from '../config.map.js';
import { DebugMap } from '../debug.map.js';
import { MapOptionType, WindowUrl } from '../url.js';
import { onMapLoaded } from './map.js';

export interface DebugState {
  featureCogId?: string | number;
  featureCogName?: string;
  featureSourceId?: string | number;
  featureSourceName?: string;
  tileSet?: ConfigTileSetRaster | null;
  imagery?: ConfigImagery | null;
  config?: string | null;
  wmtsLink?: string;
  isCog?: boolean;
}

function debugSlider(label: 'osm' | 'linz-topographic' | 'linz-aerial', onInput: FormEventHandler): ReactNode {
  return (
    <input
      className="debug__slider"
      type="range"
      min="0"
      max="1"
      step="0.05"
      defaultValue={String(Config.map.debug[`debug.layer.${label}`])}
      onChange={onInput}
    />
  );
}

export class Debug extends Component<{ map: maplibregl.Map }, DebugState> {
  debugMap = new DebugMap();
  state: DebugState = {};

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
      Config.map.on('dateRange', this.setWMTSLink);
      this.updateFromConfig();
      if (Config.map.debug['debug.screenshot']) {
        map.once('idle', async () => {
          // Ensure all the attribution data has loaded
          await Promise.all([...Attributions.values()]);
          await new Promise((r) => setTimeout(r, 250));
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
    if (this.state.tileSet?.id !== Config.map.layerId || this.state.config !== Config.map.config) {
      this._loadingConfig = this._loadingConfig.then(() => this.loadConfig());
    }
    this.debugMap.setPurple(Config.map.debug['debug.background'] === 'magenta');
    this.debugMap.adjustRaster(this.props.map, 'osm', Config.map.debug['debug.layer.osm']);
    this.debugMap.adjustRaster(this.props.map, 'linz-aerial', Config.map.debug['debug.layer.linz-aerial']);
    this.debugMap.adjustVector(this.props.map, Config.map.debug['debug.layer.linz-topographic']);
    this.setVectorShown(Config.map.debug['debug.source'], 'source');
    this.setVectorShown(Config.map.debug['debug.cog'], 'cog');
  }

  /** Show the source bounding box ont he map */
  toggleCogs: ChangeEventHandler = (e) => {
    const target = e.target as HTMLInputElement;
    Config.map.setDebug('debug.cog', target.checked);
    this.setVectorShown(target.checked, 'cog');
  };

  /** Show the source bounding box ont he map */
  toggleSource: ChangeEventHandler = (e) => {
    const target = e.target as HTMLInputElement;
    Config.map.setDebug('debug.source', target.checked);
    this.setVectorShown(target.checked, 'source');
  };

  _loadingConfig: Promise<void> = Promise.resolve();
  async loadConfig(): Promise<void> {
    const tileSetId = Config.map.layerId;
    if (this.state.tileSet?.id === tileSetId) return;
    return ConfigData.getTileSet(tileSetId).then((tileSet) => {
      this.setState({ tileSet, config: Config.map.config });

      if (tileSet == null) return;
      if (tileSet.layers.length !== 1) return;

      const projectionCode = Config.map.tileMatrix.projection.code;
      const imageryId = tileSet.layers[0][projectionCode];
      if (imageryId == null) return;

      this.debugMap.fetchSourceLayer(imageryId, 'cog').then((cog) => {
        this.setState({ isCog: cog != null });
      });

      return ConfigData.getImagery(tileSetId, imageryId).then((imagery) => {
        this.setState({ imagery, config: Config.map.config });
      });
    });
  }

  render(): ReactNode {
    if (Config.map.debug['debug.screenshot']) return null;
    const wmtsUrl = WindowUrl.toTileUrl({
      urlType: MapOptionType.Wmts,
      tileMatrix: Config.map.tileMatrix,
      layerId: Config.map.layerId,
      config: Config.map.config,
      dateRange: Config.map.dateRange,
    });

    const title = this.state.imagery?.title;
    return (
      <div className="debug">
        <div className="debug__info">
          <label className="debug__label">Id</label>
          <div className="debug__value">{Config.map.layerId}</div>
        </div>
        {title == null ? null : (
          <div className="debug__info">
            <label className="debug__label">Title</label>
            <div className="debug__value">{title}</div>
          </div>
        )}
        {this.renderWMTS()}
        <div className="debug__info">
          <label className="debug__label">TileMatrix</label>
          <div className="debug__value">{Config.map.tileMatrix.identifier}</div>
        </div>
        {this.renderSliders()}
        {this.renderPurple()}
        {this.renderCogToggle()}
        {this.renderSourceToggle()}
      </div>
    );
  }

  setWMTSLink(): void {
    const wmtsLink = WindowUrl.toTileUrl(
      MapOptionType.Wmts,
      Config.map.tileMatrix,
      Config.map.layerId,
      undefined,
      Config.map.config,
      Config.map.dateRange,
    );
    this.setState({ wmtsLink });
  }

  renderWMTS(): ReactNode {
    this.setWMTSLink();
    return (
      <div className="debug__info">
        <label className="debug__label"></label>
        <div className="debug__value">
          {Config.map.tileMatrix.projection.toEpsgString()} - <a href={this.state.wmtsLink}>WMTS</a>
        </div>
      </div>
    );
  }

  renderPurple(): ReactNode | null {
    if (Config.map.debug['debug.screenshot']) return;
    return (
      <div className="debug__info">
        <label className="debug__label">Purple</label>
        <input
          type="checkbox"
          onChange={this.debugMap.togglePurple}
          checked={Config.map.debug['debug.background'] === 'magenta'}
        />
      </div>
    );
  }

  renderCogToggle(): ReactNode {
    if (this.state.imagery == null) return null;
    const cogLocation = WindowUrl.toImageryUrl(this.state.imagery.id, 'covering.geojson');
    if (!this.state.isCog) return;
    return (
      <Fragment>
        <div className="debug__info">
          <label className="debug__label">
            <a href={cogLocation} title="Source geojson">
              Cogs
            </a>
          </label>
          <input type="checkbox" onChange={this.toggleCogs} checked={Config.map.debug['debug.cog']} />
        </div>
        {this.state.featureCogId == null ? null : (
          <div className="debug__info" title={String(this.state.featureCogName)}>
            <label className="debug__label">CogId</label>
            {String(this.state.featureCogName).split('/').pop()}
          </div>
        )}
      </Fragment>
    );
  }

  downloadSource = async (): Promise<void> => {
    const im = this.state.imagery;
    if (im == null) return;
    const geoJson = ConfigData.getGeoJson(im);
    if (geoJson == null) return;

    // Create a magic a href to download the geojson
    const dataStr = `data:text/json;charset=utf-8,` + encodeURIComponent(JSON.stringify(geoJson));
    const aEl = document.createElement('a');
    aEl.setAttribute('href', dataStr);
    aEl.setAttribute('download', im.name + '.json');
    document.body.appendChild(aEl);
    aEl.click();
    aEl.remove();
  };

  renderSourceToggle(): ReactNode {
    if (this.state.imagery == null) return null;
    return (
      <Fragment>
        <div className="debug__info">
          <label className="debug__label">
            <a onClick={this.downloadSource} href="#" title="Source geojson">
              Source
            </a>
          </label>
          <input type="checkbox" onChange={this.toggleSource} checked={Config.map.debug['debug.source']} />
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

  renderSliders(): ReactNode | null {
    // Disable the sliders for screenshots
    if (Config.map.debug['debug.screenshot']) return;
    // Only 3857 currently works with OSM/Topographic map
    if (Config.map.tileMatrix.identifier !== GoogleTms.identifier) {
      return (
        <div className="debug__info">
          <label className="debug__label">LINZ Aerial</label>
          {debugSlider('linz-aerial', this.debugMap.adjustLinzAerial)}
        </div>
      );
    }

    return (
      <Fragment>
        <div className="debug__info">
          <label className="debug__label">OSM</label>
          {debugSlider('osm', this.debugMap.adjustOsm)}
        </div>
        <div className="debug__info">
          <label className="debug__label">Topographic</label>
          {debugSlider('linz-topographic', this.debugMap.adjustTopographic)}
        </div>
        <div className="debug__info">
          <label className="debug__label">LINZ Aerial</label>
          {debugSlider('linz-aerial', this.debugMap.adjustLinzAerial)}
        </div>
      </Fragment>
    );
  }

  trackMouseMove(layerId: string, type: 'source' | 'cog'): void {
    const sourceId = `${layerId}_${type}`;
    const layerFillId = `${sourceId}_fill`;
    const map = this.props.map;

    let lastFeatureId: string | number | undefined;
    const stateName = type === 'source' ? `featureSource` : `featureCog`;

    // Onclick copy the location into the clipboard
    map.on('click', layerFillId, (e) => {
      const features = e.features;
      if (features == null || features.length === 0) return;
      const firstFeature = features[0];

      const location = firstFeature.properties?.['location'] ?? firstFeature.properties?.['name'];
      if (location == null) return;

      navigator.clipboard.writeText(location).then(() => {
        const div = document.createElement('div');
        div.innerText = `Copied ${location}`;
        div.className = 'toast-message';
        div.title = location;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2500);
      });
    });

    map.on('mousemove', layerFillId, (e) => {
      const features = e.features;
      if (features == null || features.length === 0) return;
      const firstFeature = features[0];
      if (firstFeature.id === lastFeatureId) return;
      if (lastFeatureId != null) map.setFeatureState({ source: sourceId, id: lastFeatureId }, { hover: false });

      lastFeatureId = firstFeature.id;
      this.setState({
        [`${stateName}Id`]: lastFeatureId,
        [`${stateName}Name`]: firstFeature.properties?.['name'],
      } as DebugState);
      map.setFeatureState({ source: sourceId, id: lastFeatureId }, { hover: true });
    });
    map.on('mouseleave', layerFillId, () => {
      if (lastFeatureId == null) return;
      map.setFeatureState({ source: sourceId, id: lastFeatureId }, { hover: false });

      lastFeatureId = undefined;
      this.setState({ [`${stateName}Id`]: undefined, [`${stateName}Name`]: undefined } as unknown as DebugState);
    });
  }

  setVectorShown(isShown: boolean, type: 'source' | 'cog'): void {
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

    if (this.state.imagery == null) return;
    this.debugMap.loadSourceLayer(this.props.map, layerId, this.state.imagery, type).then(() => {
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
}

import { ConfigImagery } from '@basemaps/config/src/config/imagery.js';
import { ConfigTileSetRaster } from '@basemaps/config/src/config/tile.set.js';
import { GoogleTms } from '@basemaps/geo';
import { Component, ComponentChild, Fragment } from 'preact';
import { Attributions } from '../attribution.js';
import { Config } from '../config.js';
import { ConfigData } from '../config.layer.js';
import { MapConfig } from '../config.map.js';
import { DebugMap } from '../debug.map.js';
import { WindowUrl } from '../url.js';
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
    tileSet: ConfigTileSetRaster | null;
    imagery: ConfigImagery | null;
    config: string | null;
  }
> {
  debugMap = new DebugMap();

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
  toggleCogs = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    Config.map.setDebug('debug.cog', target.checked);
    this.setVectorShown(target.checked, 'cog');
  };

  /** Show the source bounding box ont he map */
  toggleSource = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    Config.map.setDebug('debug.source', target.checked);
    this.setVectorShown(target.checked, 'source');
  };

  _loadingConfig: Promise<void> = Promise.resolve();
  async loadConfig(): Promise<void> {
    const tileSetId = Config.map.layerId;
    if (this.state.tileSet?.id === tileSetId) return;
    return ConfigData.getTileSet(tileSetId).then((tileSet) => {
      this.setState({ ...this.state, tileSet });

      if (tileSet == null) return;
      if (tileSet.layers.length !== 1) return;

      const projectionCode = Config.map.tileMatrix.projection.code;
      const imageryId = tileSet.layers[0][projectionCode];
      if (imageryId == null) return;

      return ConfigData.getImagery(tileSetId, imageryId).then((imagery) => {
        this.setState({ ...this.state, imagery });
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
        {this.renderSliders()}
        {this.renderPurple()}
        {this.renderCogToggle()}
        {this.renderSourceToggle()}
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
          onClick={this.debugMap.togglePurple}
          checked={Config.map.debug['debug.background'] === 'magenta'}
        />
      </div>
    );
  }

  renderCogToggle(): ComponentChild {
    if (this.state.imagery == null) return null;
    const cogLocation = WindowUrl.toImageryUrl(this.state.imagery.id, 'covering.geojson');

    return (
      <Fragment>
        <div className="debug__info">
          <label className="debug__label">
            <a href={cogLocation} title="Source geojson">
              Cogs
            </a>
          </label>
          <input type="checkbox" onClick={this.toggleCogs} checked={Config.map.debug['debug.cog']} />
        </div>
        {this.state.featureSourceId == null ? null : (
          <div className="debug__info" title={String(this.state.featureCogName)}>
            <label className="debug__label">CogId</label>
            {String(this.state.featureCogName).split('/').pop()}
          </div>
        )}
      </Fragment>
    );
  }

  renderSourceToggle(): ComponentChild {
    if (this.state.imagery == null) return null;
    const sourceLocation = WindowUrl.toImageryUrl(this.state.imagery.id, 'source.geojson');
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

  renderSliders(): ComponentChild | null {
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

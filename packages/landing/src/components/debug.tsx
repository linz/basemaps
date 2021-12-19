import { GoogleTms } from '@basemaps/geo';
import maplibre, { AnyLayer, Style } from 'maplibre-gl';
import { Component, ComponentChild, Fragment } from 'preact';
import { Config } from '../config.js';
import { MapOptionType, WindowUrl } from '../url.js';

function debugSlider(onInput: (e: Event) => unknown): ComponentChild {
  return <input className="debug__slider" type="range" min="0" max="1" step="0.05" value="0" onInput={onInput} />;
}

export class Debug extends Component<{ map: maplibre.Map }> {
  componentDidMount(): void {
    setTimeout(() => this.props.map.resize(), 100);
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
          <input type="checkbox" onClick={this.togglePurple} />
        </div>
        {this.renderSourceToggle()}
      </div>
    );
  }

  renderSourceToggle(): ComponentChild {
    // TODO this is a nasty hack to detect if a direct imageryId is being viewed
    if (!Config.map.layerId.startsWith('01')) return null;

    return (
      <div className="debug__info">
        <label className="debug__label">Source</label>
        <input type="checkbox" onClick={this.toggleSource} />
      </div>
    );
  }

  /** Show the source bounding box ont he map */
  toggleSource = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    const map = this.props.map;
    const sourceId = Config.map.layerId + '_source';
    const sourceUri = WindowUrl.toImageryUrl('im_' + Config.map.layerId, 'source.geojson');
    if (target.checked) {
      if (map.getSource(sourceId) == null) map.addSource(sourceId, { type: 'geojson', data: sourceUri });
      map.addLayer({
        id: sourceId,
        type: 'line',
        source: sourceId,
        paint: { 'line-color': 'rgba(255,50,100,0.87)', 'line-width': 2 },
      });
    } else {
      if (map.getLayer(sourceId) != null) map.removeLayer(sourceId);
    }
  };

  renderSliders(): ComponentChild | null {
    // Only 3857 currently works with OSM/Topographic map
    if (Config.map.tileMatrix.identifier !== GoogleTms.identifier) return;

    return (
      <Fragment>
        <div className="debug__info">
          <label className="debug__label">OSM</label>
          {debugSlider(this.adjustOsm)}
        </div>
        <div className="debug__info">
          <label className="debug__label">Topographic</label>
          {debugSlider(this.adjustTopographic)}
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

  adjustTopographic = async (e: Event): Promise<void> => {
    const slider = e.target as HTMLInputElement;
    const value = Number(slider.value);
    const styleJson = await this.styleJson;

    const map = this.props.map;

    const hasTopographic = map.getSource('LINZ Basemaps');
    if (hasTopographic == null) {
      const source = styleJson.sources?.['LINZ Basemaps'];
      if (source == null) return;
      map.addSource('LINZ Basemaps', source);
      map.setStyle({ ...map.getStyle(), glyphs: styleJson.glyphs, sprite: styleJson.sprite });
      // Setting glyphs/sprites forces a full map refresh, wait for the refresh before adjusting the style
      map.once('style.load', () => this.adjustTopographic(e));
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
  };

  adjustOsm = (e: Event): void => {
    const slider = e.target as HTMLInputElement;
    const hasOsm = this.props.map.getSource('osm');
    if (hasOsm == null) {
      this.props.map.addSource('osm', {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
      });
    }

    const range = Number(slider.value);
    if (range === 0) {
      this.props.map.removeLayer('osm');
      return;
    }

    if (this.props.map.getLayer('osm') == null) {
      this.props.map.addLayer({
        id: 'osm',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 24,
        paint: { 'raster-opacity': 0 },
      });
    }
    this.props.map.setPaintProperty('osm', 'raster-opacity', range);
  };

  togglePurple = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    if (target?.checked === true) document.body.style.backgroundColor = 'magenta';
    else document.body.style.backgroundColor = '';
  };
}

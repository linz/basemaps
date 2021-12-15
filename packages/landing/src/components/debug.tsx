import { Component, ComponentChild } from 'preact';
import maplibre from 'maplibre-gl';
import { Config } from '../config.js';

export class Debug extends Component<{ map: maplibre.Map }> {
  componentDidMount(): void {
    setTimeout(() => this.props.map.resize(), 100);
  }

  render(): ComponentChild {
    return (
      <div className="debug">
        <div className="debug__info">
          <label className="debug__label">ImageId</label>
          <div className="debug__value"> {Config.map.layerId}</div>
        </div>
        <div className="debug__info">
          <label className="debug__label">Projection </label>
          <div className="debug__value">{Config.map.tileMatrix.projection.toEpsgString()}</div>
        </div>
        <div className="debug__info">
          <label className="debug__label">TileMatrix </label>
          <div className="debug__value">{Config.map.tileMatrix.identifier}</div>
        </div>
        <div className="debug__info">
          <label className="debug__label">OSM</label>
          <input className="osm__slider" type="range" min="0" max="1" step="0.05" value="0" onInput={this.adjustOSM} />
        </div>
        <div className="debug__info">
          <label className="debug__label">Purple</label>
          <input type="checkbox" onClick={this.togglePurple} />
        </div>
      </div>
    );
  }

  adjustOSM = (e: Event): void => {
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

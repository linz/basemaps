import { EpsgCode } from '@basemaps/geo';
import { Component, ComponentChild, Fragment } from 'preact';
import { Config, GaEvent, gaEvent } from '../config.js';
import { LayerInfo, MapConfig } from '../config.map.js';

export interface LayerSwitcherDropdownState {
  layers?: Map<string, LayerInfo>;

  currentLayer: string;
}
export class LayerSwitcherDropdown extends Component<unknown, LayerSwitcherDropdownState> {
  _events: (() => boolean)[] = [];
  componentWillMount(): void {
    this.setState({ ...this.state, currentLayer: Config.map.layerKey });

    Config.map.layers.then((layers) => this.setState({ ...this.state, layers }));

    this._events.push(
      Config.map.on('layer', () => this.setState({ ...this.state, currentLayer: Config.map.layerKey })),
      Config.map.on('tileMatrix', () => this.setState(this.state)),
    );
  }

  componentWillUnmount(): void {
    for (const e of this._events) e();
    this._events = [];
  }

  onChange = (e: Event): void => {
    const target = e.target as HTMLSelectElement;
    const [layerId, style] = target.value.split('::');
    Config.map.setLayerId(layerId, style);
    gaEvent(GaEvent.Ui, 'layer:' + target.value);

    // Configure the bounds of the map to match the new layer
    Config.map.layers.then((f) => {
      const layer = f.get(layerId);
      if (layer == null) return;
      Config.map.emit('bounds', [layer.upperLeft, layer.lowerRight]);
    });

    window.history.pushState(null, '', `?${MapConfig.toUrl(Config.map)}`);
  };

  render(): ComponentChild {
    return (
      <div class="LuiDeprecatedForms">
        <h6>Layers</h6>
        <select onChange={this.onChange} value={this.state.currentLayer}>
          {this.renderAerialLayers()}
        </select>
      </div>
    );
  }

  renderAerialLayers(): ComponentChild {
    if (this.state.layers == null || this.state.layers.size === 0) return;
    const categories: Map<string, ComponentChild[]> = new Map();

    for (const layer of this.state.layers.values()) {
      if (!layer.projections.has(Config.map.tileMatrix.projection.code)) continue;
      const layerCategory = categories.get(layer.category ?? 'Unknown') ?? [];
      layerCategory.push(<option value={layer.id}>{layer.name.replace(` ${layer.category}`, '')}</option>);
      categories.set(layer.category ?? 'Unknown', layerCategory);
    }

    if (categories.size === 0) return;

    const output: ComponentChild[] = [];
    for (const [layerName, layers] of categories.entries()) {
      if (layers.length === 0) continue;
      output.push(<optgroup label={layerName}>{...layers}</optgroup>);
    }

    return <Fragment>{output}</Fragment>;
  }
}

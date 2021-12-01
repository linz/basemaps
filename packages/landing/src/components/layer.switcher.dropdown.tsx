import { EpsgCode } from '@basemaps/geo';
import { Component, ComponentChild, Fragment } from 'preact';
import { Config, GaEvent, gaEvent } from '../config.js';
import { LayerInfo, MapConfig } from '../config.map.js';
import { SplitIo } from '../split.js';

export interface LayerSwitcherDropdownState {
  layers?: Map<string, LayerInfo>;
  /** Is the layer switcher turned on */
  isEnabled?: boolean;
  /** Can users select individual aerial imagery layers */
  isIndividualEnabled?: boolean;
  /** Can users select the basic style */
  isBasicStyleEnabled?: boolean;
  currentLayer: string;
}
export class LayerSwitcherDropdown extends Component<unknown, LayerSwitcherDropdownState> {
  _events: (() => boolean)[] = [];
  componentWillMount(): void {
    SplitIo.getClient().then((f) => {
      const isEnabled = f?.getTreatment('layer-switcher-dropdown') === 'on';
      const isIndividualEnabled = f?.getTreatment('layer-switcher-individual-layers') === 'on';
      const isBasicStyleEnabled = f?.getTreatment('layer-switcher-basic') === 'on';
      this.setState({ ...this.state, isEnabled, isIndividualEnabled, isBasicStyleEnabled });
      /** Load all the map config layers */
      if (isEnabled) Config.map.layers.then((layers) => this.setState({ ...this.state, layers }));
    });

    this.setState({ ...this.state, currentLayer: Config.map.layerKey });

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
    gaEvent(GaEvent.Ui, 'layer:' + target);

    // Configure the bounds of the map to match the new layer
    Config.map.layers.then((f) => {
      const layer = f.get(layerId);
      if (layer == null) return;
      Config.map.emit('bounds', [layer.upperLeft, layer.lowerRight]);
    });

    window.history.pushState(null, '', `?${MapConfig.toUrl(Config.map)}`);
  };

  render(): ComponentChild {
    if (this.state.isEnabled !== true) return;
    return (
      <div class="LuiDeprecatedForms">
        <h6>Layers</h6>
        <select onChange={this.onChange} value={this.state.currentLayer}>
          <optgroup label="Basemaps">
            <option value="aerial"> Aerial Imagery</option>
            <option value="topographic::topographic">Topographic</option>
            {this.state.isBasicStyleEnabled ? <option value="topographic::basic">Basic</option> : undefined}
          </optgroup>
          {this.renderAerialLayers()}
        </select>
      </div>
    );
  }

  renderAerialLayers(): ComponentChild {
    if (this.state.isIndividualEnabled !== true) return;
    if (this.state.layers == null || this.state.layers.size === 0) return;

    const rural: ComponentChild[] = [];
    const urban: ComponentChild[] = [];

    for (const layer of this.state.layers.values()) {
      if (!layer.projections.has(EpsgCode.Google)) continue;

      const node = <option value={layer.id}>{layer.name}</option>;
      if (layer.name.toLowerCase().includes(' rural ')) rural.push(node);
      else urban.push(node);
    }

    if (rural.length === 0 || urban.length === 0) return;
    return (
      <Fragment>
        <optgroup label="Aerial Imagery - Urban">{...urban}</optgroup>;
        <optgroup label="Aerial Imagery - Rural">{...rural}</optgroup>;
      </Fragment>
    );
  }
}

import { ChangeEventHandler, Component, ReactNode } from 'react';
import Select from 'react-select';
import { Config, GaEvent, gaEvent } from '../config.js';
import { LayerInfo, MapConfig } from '../config.map.js';

type CategoryMap = Map<string, { label: string; options: { label: string; value: string }[] }>;

const CategoryOrder = new Map<string, number>([
  ['Basemaps', 1],
  ['Satellite Imagery', 2],
  ['Urban Aerial Photos', 3],
  ['Rural Aerial Photos', 4],
  ['Scanned Aerial Imagery', 5],
  ['Event', 6],
  ['Bathymetry', 7],
  ['Elevation', 8],
]);

export interface GroupedOptions {
  label: string;
  options: Option[];
}
export interface Option {
  label: string;
  value: string;
}

export interface LayerSwitcherDropdownState {
  layers?: Map<string, LayerInfo>;
  zoomToExtent: boolean;
  currentLayer: string;
}

const ignoredLayers = new Set(['all']);

export class LayerSwitcherDropdown extends Component<unknown, LayerSwitcherDropdownState> {
  _events: (() => boolean)[] = [];
  state: LayerSwitcherDropdownState = { zoomToExtent: true, currentLayer: 'unknown' };

  componentDidMount(): void {
    this.setState({ zoomToExtent: true, currentLayer: Config.map.layerKey });

    Config.map.layers.then((layers) => this.setState({ layers }));

    this._events.push(
      Config.map.on('layer', () => this.setState({ currentLayer: Config.map.layerKey })),
      Config.map.on('tileMatrix', () => this.forceUpdate()),
    );
  }

  componentWillUnmount(): void {
    for (const e of this._events) e();
    this._events = [];
  }

  onLayerChange = (opt: Option | null): void => {
    if (opt == null) return;
    const [layerId, style] = opt.value.split('::');
    Config.map.setLayerId(layerId, style);
    gaEvent(GaEvent.Ui, 'layer:' + opt.value);

    // Configure the bounds of the map to match the new layer
    if (this.state.zoomToExtent) {
      Config.map.layers.then((f) => {
        const layer = f.get(layerId);
        if (layer == null) return;
        Config.map.emit('bounds', [layer.upperLeft, layer.lowerRight]);
      });
    }

    window.history.pushState(null, '', `?${MapConfig.toUrl(Config.map)}`);
  };

  onZoomExtentChange: ChangeEventHandler<unknown> = (e) => {
    const target = e.target as HTMLInputElement;
    this.setState({ zoomToExtent: target.checked });
  };

  render(): ReactNode {
    const ret = this.makeOptions();

    return (
      <div className="LuiDeprecatedForms">
        <h6>Layers</h6>
        <Select<Option> options={ret.options} onChange={this.onLayerChange} value={ret.current} />
        <div className="lui-input-group-wrapper">
          <div className="lui-checkbox-container">
            <input type="checkbox" onChange={this.onZoomExtentChange} checked={this.state.zoomToExtent} />
            <label>Zoom to Extent</label>
          </div>
        </div>
      </div>
    );
  }

  makeOptions(): { options: GroupedOptions[]; current: Option | null } {
    if (this.state.layers == null || this.state.layers.size === 0) return { options: [], current: null };
    const categories: CategoryMap = new Map();
    const currentLayer = this.state.currentLayer;
    let current: Option | null = null;

    for (const layer of this.state.layers.values()) {
      if (ignoredLayers.has(layer.id)) continue;
      if (!layer.projections.has(Config.map.tileMatrix.projection.code)) continue;
      const layerId = layer.category ?? 'Unknown';
      const layerCategory = categories.get(layerId) ?? { label: layerId, options: [] };
      const opt = { value: layer.id, label: layer.name.replace(` ${layer.category}`, '') };
      layerCategory.options.push(opt);
      categories.set(layerId, layerCategory);
      if (layer.id === currentLayer) current = opt;
    }
    const orderedCategories: CategoryMap = new Map(
      [...categories].sort((a, b) => {
        const fallbackOrder = 999;
        const orderA = CategoryOrder.get(a[0]) ?? fallbackOrder;
        const orderB = CategoryOrder.get(b[0]) ?? fallbackOrder;
        if (orderA > orderB) return 1;
        if (orderA < orderB) return -1;
        return a[0].localeCompare(b[0]);
      }),
    );
    return { options: [...orderedCategories.values()], current: current };
  }
}

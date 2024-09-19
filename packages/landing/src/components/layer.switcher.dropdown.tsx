import { Bounds, GoogleTms, Projection } from '@basemaps/geo';
import { ChangeEventHandler, Component, ReactNode } from 'react';
import Select from 'react-select';

import { Config, GaEvent, gaEvent } from '../config.js';
import { LayerInfo, MapConfig } from '../config.map.js';

type CategoryMap = Map<string, { label: string; options: { label: string; value: string }[] }>;

const Categories = [
  'Basemaps',
  'Satellite Imagery',
  'Urban Aerial Photos',
  'Rural Aerial Photos',
  'Scanned Aerial Imagery Basemaps',
  'Scanned Aerial Imagery',
  'Event',
  'Bathymetry',
  'Elevation',
];

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
  /** Should the map be zoomed to the extent of the layer when the layer is changed */
  zoomToExtent: boolean;
  /** Should the drop down be limited to the approximate extent of the map */
  filterToExtent: boolean;
  currentLayer: string;
}

const ignoredLayers = new Set(['all']);

export class LayerSwitcherDropdown extends Component<unknown, LayerSwitcherDropdownState> {
  _events: (() => boolean)[] = [];

  constructor(p: unknown) {
    super(p);
    this.state = { zoomToExtent: true, currentLayer: 'unknown', filterToExtent: false };
  }

  override componentDidMount(): void {
    this.setState({ zoomToExtent: true, currentLayer: Config.map.layerKey });

    void Config.map.layers.then((layers) => {
      this.setState({ layers });
      // This needs to run on next tick or the sate will not have updated
      setTimeout(() => this.ensurePipelineSet(), 10);
    });

    this._events.push(
      Config.map.on('layer', () => {
        this.setState({ currentLayer: Config.map.layerKey });
        // This needs to run on next tick or the sate will not have updated
        setTimeout(() => this.ensurePipelineSet(), 10);
      }),
      Config.map.on('tileMatrix', () => this.forceUpdate()),
    );
  }

  /**
   * When the layers list load it contains more information like the default pipeline which is needed to create the tile XYZ url
   * so if the pipeline exists and its not set to the currently selected one update it
   */
  ensurePipelineSet(): void {
    const currentLayer = this.state.currentLayer;
    if (currentLayer == null) return;

    const layer = this.getLayer(currentLayer);
    if (layer?.pipeline) {
      const [layerId, style] = currentLayer.split('::');
      Config.map.setLayerId(layerId, style, layer.pipeline, layer.imageFormat);
    }
  }

  override componentWillUnmount(): void {
    for (const e of this._events) e();
    this._events = [];
  }

  /**
   * lookup a layer from the liast of layers used to render the dropdown
   * @param layerId
   * @returns the layer or null if its not found
   */
  getLayer(layerId: string): LayerInfo | null {
    if (this.state.layers == null) return null;
    for (const layer of this.state.layers.values()) {
      if (layer.id === layerId) return layer;
    }
    return null;
  }

  onLayerChange = (opt: Option | null): void => {
    if (opt == null) return;
    const layer = this.getLayer(opt.value);
    const [layerId, style] = opt.value.split('::');
    Config.map.setLayerId(layerId, style, layer?.pipeline, layer?.imageFormat);
    gaEvent(GaEvent.Ui, 'layer:' + opt.value);

    // Configure the bounds of the map to match the new layer
    if (this.state.zoomToExtent) {
      void Config.map.layers.then((f) => {
        const layer = f.get(layerId);
        if (layer == null) return;
        if (layer.upperLeft == null || layer.lowerRight == null) return;
        Config.map.emit('bounds', [layer.upperLeft, layer.lowerRight]);
      });
    }

    window.history.pushState(null, '', `?${MapConfig.toUrl(Config.map)}`);
  };

  onZoomExtentChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    gaEvent(GaEvent.Ui, 'layer-list:zoomToExtent:' + e.target.checked);
    this.setState({ zoomToExtent: e.target.checked });
  };

  onFilterExtentChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    gaEvent(GaEvent.Ui, 'layer-list:filterToExtent:' + e.target.checked);
    this.setState({ filterToExtent: e.target.checked });
  };

  override render(): ReactNode {
    const ret = this.makeOptions();

    return (
      <div className="LuiDeprecatedForms">
        <h6>Layers</h6>
        <Select
          options={ret.options}
          onChange={this.onLayerChange}
          value={ret.current}
          classNamePrefix="layer-selector"
          id="layer-selector"
        />
        <div className="lui-input-group-wrapper" style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div className="lui-checkbox-container">
            <input type="checkbox" onChange={this.onFilterExtentChange} checked={this.state.filterToExtent} />
            <label title="Filter the layer list to approximately the current map extent">Filter to Extent</label>
          </div>
          <div className="lui-checkbox-container">
            <input type="checkbox" onChange={this.onZoomExtentChange} checked={this.state.zoomToExtent} />
            <label title="On layer change zoom to the extent of the layer">Zoom to Extent</label>
          </div>
        </div>
      </div>
    );
  }

  makeOptions(): { options: GroupedOptions[]; current: Option | null } {
    if (this.state.layers == null || this.state.layers.size === 0) return { options: [], current: null };
    const categories: CategoryMap = new Map();
    const currentLayer = this.state.currentLayer;
    const filterToExtent = this.state.filterToExtent;

    const location = Config.map.location;
    const loc3857 = Projection.get(GoogleTms).fromWgs84([location.lon, location.lat]);
    const tileSize = GoogleTms.tileSize * GoogleTms.pixelScale(Math.floor(location.zoom)); // width of 1 tile
    // Assume the current bounds are 3x3 tiles, todo would be more correct to use the map's bounding box but we dont have access to it here
    const bounds = new Bounds(loc3857[0], loc3857[1], 1, 1).scaleFromCenter(3 * tileSize, 3 * tileSize);

    let current: Option | null = null;

    for (const layer of this.state.layers.values()) {
      if (ignoredLayers.has(layer.id)) continue;
      if (!layer.projections.has(Config.map.tileMatrix.projection.code)) continue;

      // Always show the current layer
      if (layer.id !== currentLayer) {
        // Limit all other layers to the extent if requested
        if (filterToExtent && !doesLayerIntersect(bounds, layer)) continue;
      }

      const layerId = layer.category ?? 'Unknown';
      const layerCategory = categories.get(layerId) ?? { label: layerId, options: [] };
      const opt = { value: layer.id, label: layer.name.replace(` ${layer.category}`, '') };
      layerCategory.options.push(opt);
      categories.set(layerId, layerCategory);
      if (layer.id === currentLayer) current = opt;
    }
    const orderedCategories: CategoryMap = new Map(
      [...categories].sort((a, b) => {
        const orderA = Categories.indexOf(a[0]);
        const orderB = Categories.indexOf(b[0]);
        if (orderA === orderB) return a[0].localeCompare(b[0]);
        if (orderA === -1 || orderA < orderB) return -1;
        return 1;
      }),
    );
    return { options: [...orderedCategories.values()], current: current };
  }
}

/**
 * Determine if the bounds in EPSG:3857 intersects the provided layer
 *
 * TODO: It would be good to then use a more comprehensive intersection if the bounding box intersects,
 * there are complex polygons inside the attribution layer that could be used but they do not have all
 * the polygons
 *
 * @param bounds Bounding box in EPSG:3857
 * @param layer layer to check
 * @returns true if it intersects, false otherwise
 */
function doesLayerIntersect(bounds: Bounds, layer: LayerInfo): boolean {
  // No layer information assume it intersects
  if (layer.lowerRight == null || layer.upperLeft == null) return true;

  // It is somewhat easier to find intersections in EPSG:3857
  const ul3857 = Projection.get(GoogleTms).fromWgs84(layer.upperLeft);
  const lr3857 = Projection.get(GoogleTms).fromWgs84(layer.lowerRight);

  const layerBounds = Bounds.fromBbox([ul3857[0], ul3857[1], lr3857[0], lr3857[1]]);

  return bounds.intersects(layerBounds);
}

import { intersection, MultiPolygon, Wgs84 } from '@linzjs/geojson';
import { ChangeEventHandler, Component, ReactNode } from 'react';
import Select from 'react-select';

import { MapAttrState } from '../attribution.js';
import { Config, GaEvent, gaEvent } from '../config.js';
import { LayerInfo, MapConfig } from '../config.map.js';

type CategoryMap = Map<string, { label: string; options: { label: string; value: string }[] }>;

const Categories = [
  'Basemaps',
  'Basemaps - Hillshade',
  'Basemaps - Elevation',
  'Basemaps - Scanned Aerial Imagery',
  'Satellite Imagery',
  'Urban Aerial Photos',
  'Rural Aerial Photos',
  'Scanned Aerial Imagery',
  'Event',
  'Topographic',
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

    void MapAttrState.getAll().then(() => this.forceUpdate());

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

  renderTotal(total: number, hidden: number): ReactNode | null {
    if (total === 0) return null;
    if (hidden > 0) {
      return (
        <p title={`${hidden} layers hidden by filter`}>
          {total - hidden} / {total}
        </p>
      );
    }
    return <p title={`${total} layers`}>{total}</p>;
  }

  override render(): ReactNode {
    const ret = this.makeOptions();

    return (
      <div className="LuiDeprecatedForms">
        <h6 className="layers-title">Layers {this.renderTotal(ret.total, ret.hidden)}</h6>
        <Select
          options={ret.options}
          onChange={this.onLayerChange}
          value={ret.current}
          classNamePrefix="layer-selector"
          id="layer-selector"
          maxMenuHeight={520}
        />
        <div
          className="lui-input-group-wrapper"
          style={{ display: 'flex', justifyContent: 'space-around', height: 48 }}
        >
          <div className="lui-checkbox-container">
            <input type="checkbox" onChange={this.onFilterExtentChange} checked={this.state.filterToExtent} />
            <label title="Filter the layer list to approximately the current map extent">
              Filter by map view
              {ret.hidden > 0 ? (
                <p>
                  <b>{ret.hidden}</b> layers hidden
                </p>
              ) : null}
            </label>
          </div>
          <div className="lui-checkbox-container">
            <input type="checkbox" onChange={this.onZoomExtentChange} checked={this.state.zoomToExtent} />
            <label title="On layer change zoom to the extent of the layer">Zoom to layer</label>
          </div>
        </div>
      </div>
    );
  }

  makeOptions(): { options: GroupedOptions[]; current: Option | null; hidden: number; total: number } {
    let hidden = 0;
    let total = 0;
    if (this.state.layers == null || this.state.layers.size === 0) return { options: [], current: null, hidden, total };
    const categories: CategoryMap = new Map();
    const currentLayer = this.state.currentLayer;
    const filterToExtent = this.state.filterToExtent;

    const location = Config.map.location;
    if (location == null || location.extent == null) return { options: [], current: null, hidden, total };

    const mapExtent = Wgs84.bboxToMultiPolygon(location.extent);

    let current: Option | null = null;

    for (const layer of this.state.layers.values()) {
      if (ignoredLayers.has(layer.id)) continue;
      if (!layer.projections.has(Config.map.tileMatrix.projection.code)) continue;
      total++;
      // Always show the current layer
      if (layer.id !== currentLayer) {
        // Limit all other layers to the extent if requested
        if (filterToExtent && !doesLayerIntersect(mapExtent, layer)) {
          hidden++;
          continue;
        }
      }

      const layerId = layer.category ?? 'Unknown';
      const layerCategory = categories.get(layerId) ?? { label: layerId, options: [] };
      const opt = { value: layer.id, label: layer.title.replace(` ${layer.category}`, '') };
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

    return { options: [...orderedCategories.values()], current, hidden, total };
  }
}

/**
 * Determine if the polygon intersects the provided layer
 *
 * @param bounds polygon to check
 * @param layer layer to check
 * @returns true if it intersects, false otherwise
 */
function doesLayerIntersect(bounds: MultiPolygon, layer: LayerInfo): boolean {
  // No layer information assume it intersects
  if (layer.lowerRight == null || layer.upperLeft == null) return true;

  const poly = Wgs84.bboxToMultiPolygon([
    layer.lowerRight[0],
    layer.upperLeft[1],
    layer.upperLeft[0],
    layer.lowerRight[1],
  ]);

  const inter = intersection(bounds, poly);
  if (inter == null || inter.length === 0) return false;

  // No attribution state loaded, assume it intersects
  const attrs = MapAttrState.attrsSync.get('all');
  if (attrs == null) return true;

  const attrLayer = attrs.attributions.filter((f) => f.collection.title === layer.title);
  // Could not find a exact layer match in the attribution
  if (attrLayer.length !== 1) return true;

  return attrLayer[0].intersection(bounds);
}

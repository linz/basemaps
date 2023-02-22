import { Epsg, EpsgCode, GoogleTms, Nztm2000QuadTms, Nztm2000Tms, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { Emitter } from '@servie/events';
import { LngLatBoundsLike } from 'maplibre-gl';
import { DateRangeState } from './components/daterange.js';
import { ConfigDebug, DebugDefaults, DebugState } from './config.debug.js';
import { Config } from './config.js';
import { locationTransform } from './tile.matrix.js';
import { ensureBase58, MapLocation, MapOptionType, WindowUrl } from './url.js';

/** Default center point if none provided */
const DefaultCenter: Record<string, MapLocation> = {
  [GoogleTms.identifier]: { lat: -41.88999621, lon: 174.04924373, zoom: 5 },
  [Nztm2000Tms.identifier]: { lat: -41.277848, lon: 174.6763921, zoom: 3 },
  [Nztm2000QuadTms.identifier]: { lat: -41.88999621, lon: 174.04924373, zoom: 3 },
};

export interface MapConfigEvents {
  location: [MapLocation];
  tileMatrix: [TileMatrixSet];
  layer: [string, string | null | undefined];
  bounds: [LngLatBoundsLike];
  dateRange: [DateRangeState];
  change: null;
  visibleLayers: [string];
}

export class MapConfig extends Emitter<MapConfigEvents> {
  style: string | null = null;
  layerId = 'aerial';
  tileMatrix: TileMatrixSet = GoogleTms;
  config: string | null;
  debug: DebugState = { ...DebugDefaults };
  dateRange: DateRangeState = { dateAfter: undefined, dateBefore: undefined };
  visibleLayers: string;

  private _layers: Promise<Map<string, LayerInfo>>;
  get layers(): Promise<Map<string, LayerInfo>> {
    if (this._layers == null) this._layers = loadAllLayers();
    return this._layers;
  }

  get isDebug(): boolean {
    return this.debug.debug;
  }

  /** Map location in WGS84 */
  _location: MapLocation;
  get location(): MapLocation {
    if (this._location == null) {
      window.addEventListener('popstate', () => {
        const location = {
          ...DefaultCenter[this.tileMatrix.identifier],
          ...WindowUrl.fromHash(window.location.hash),
        };
        this.setLocation(location);
      });
      this.updateFromUrl();
      this._location = { ...DefaultCenter[this.tileMatrix.identifier], ...WindowUrl.fromHash(window.location.hash) };
    }

    return this._location;
  }

  /** Map location in tileMatrix projection */
  get transformedLocation(): MapLocation {
    return this.transformLocation(this.location.lat, this.location.lon, this.location.zoom);
  }

  get isVector(): boolean {
    return this.layerId === 'topographic';
  }

  /** Key to reference the combined layer & style  */
  get layerKey(): string {
    if (this.style == null) return this.layerId;
    return `${this.layerId}::${this.style}`;
  }

  /** Key to reference combined layer & style & tile matrix */
  get layerKeyTms(): string {
    return `${this.layerKey}::${this.tileMatrix.identifier}`;
  }

  /** Used as source and layer id in the Style JSON for a given layer ID */
  get styleId(): string {
    return `basemaps-${Config.map.layerId}`;
  }

  updateFromUrl(search: string = window.location.search): void {
    const urlParams = new URLSearchParams(search);
    const style = urlParams.get('s') ?? urlParams.get('style');
    const config = urlParams.get('c') ?? urlParams.get('config');

    const layerId = urlParams.get('i') ?? 'aerial';

    const projectionParam = (urlParams.get('p') ?? urlParams.get('tileMatrix') ?? GoogleTms.identifier).toLowerCase();
    let tileMatrix = TileMatrixSets.All.find((f) => f.identifier.toLowerCase() === projectionParam);
    if (tileMatrix == null) tileMatrix = TileMatrixSets.get(Epsg.parse(projectionParam) ?? Epsg.Google);
    if (tileMatrix.identifier === Nztm2000Tms.identifier) tileMatrix = Nztm2000QuadTms;

    const debugChanged = ConfigDebug.fromUrl(this.debug, urlParams);
    if (debugChanged) this.emit('change');

    const previousUrl = MapConfig.toUrl(this);

    this.config = config;
    this.style = style ?? null;
    this.layerId = layerId.startsWith('im_') ? layerId.slice(3) : layerId;
    this.tileMatrix = tileMatrix;

    if (this.layerId === 'topographic' && this.style == null) this.style = 'topographic';

    this.emit('tileMatrix', this.tileMatrix);
    this.emit('layer', this.layerId, this.style);
    if (previousUrl !== MapConfig.toUrl(this)) this.emit('change');
  }

  static toUrl(opts: MapConfig): string {
    const urlParams = new URLSearchParams();
    if (opts.style) urlParams.append('s', opts.style);
    if (opts.config) urlParams.append('config', ensureBase58(opts.config));
    if (opts.layerId !== 'aerial') urlParams.append('i', opts.layerId);
    if (opts.tileMatrix.identifier !== GoogleTms.identifier) urlParams.append('p', opts.tileMatrix.identifier);
    ConfigDebug.toUrl(opts.debug, urlParams);
    return urlParams.toString();
  }

  toTileUrl(
    urlType: MapOptionType,
    tileMatrix = this.tileMatrix,
    layerId = this.layerId,
    style = this.style,
    config = this.config,
    dateRange = this.dateRange,
  ): string {
    return WindowUrl.toTileUrl({ urlType, tileMatrix, layerId, style, config, dateRange });
  }

  getLocation(map: maplibregl.Map): MapLocation {
    const center = map.getCenter();
    if (center == null) throw new Error('Invalid Map location');
    const zoom = Math.floor((map.getZoom() ?? 0) * 10e3) / 10e3;
    return Config.map.transformLocation(center.lat, center.lng, zoom);
  }

  transformLocation(lat: number, lon: number, zoom: number): MapLocation {
    return locationTransform({ lat, lon, zoom }, GoogleTms, this.tileMatrix);
  }

  setLocation(l: MapLocation): void {
    if (l.lat === this.location.lat && l.lon === this.location.lon && l.zoom === this.location.zoom) return;
    this.location.lat = l.lat;
    this.location.lon = l.lon;
    this.location.zoom = l.zoom;
    this.emit('location', this.location);
    this.emit('change');
  }

  setTileMatrix(tms: TileMatrixSet): void {
    if (this.tileMatrix.identifier === tms.identifier) return;
    this.emit('tileMatrix', this.tileMatrix);
    this.emit('change');
  }

  setLayerId(layer: string, style?: string | null): void {
    if (this.layerId === layer && this.style === style) return;
    this.layerId = layer;
    this.style = style ?? null;
    this.emit('layer', this.layerId, this.style);
    this.emit('change');
  }

  setDebug<T extends keyof DebugState>(key: T, value: DebugState[T] = DebugDefaults[key]): void {
    if (this.debug[key] === value) return;
    this.debug[key] = value;
    this.emit('change');
  }
}

export interface LayerInfo {
  /** Layer id to use when fetching tiles */
  id: string;
  /** Layer name */
  name: string;
  /** Layer category */
  category?: string;
  /* Bounding box */
  upperLeft: [number, number];
  lowerRight: [number, number];
  /** What projections are enabled for this layer */
  projections: Set<EpsgCode>;
}
async function loadAllLayers(): Promise<Map<string, LayerInfo>> {
  const output: Map<string, LayerInfo> = new Map();

  const res = await fetch(WindowUrl.toBaseWmts());
  if (!res.ok) return output;

  const dom = new DOMParser();
  const xmlDoc = dom.parseFromString(await res.text(), 'text/xml');

  const layers = xmlDoc.getElementsByTagName('Layer') as HTMLCollection;

  const allLayers: LayerInfo[] = [];

  for (let i = 0; i < layers.length; i++) {
    const layer = layers.item(i);
    if (layer == null) continue;

    const title = layer.getElementsByTagName('ows:Title').item(0)?.textContent;
    const id = layer.getElementsByTagName('ows:Identifier').item(0)?.textContent;
    if (title == null || id == null) continue;
    if (title === 'aerial') continue;

    const category = layer.getElementsByTagName('ows:Keyword').item(0)?.textContent;

    const boundEl = layer.getElementsByTagName('ows:WGS84BoundingBox').item(0);
    const upperLeft = boundEl?.getElementsByTagName('ows:UpperCorner').item(0)?.textContent?.split(' ').map(Number);
    const lowerRight = boundEl?.getElementsByTagName('ows:LowerCorner').item(0)?.textContent?.split(' ').map(Number);

    const tmsTags = layer.getElementsByTagName('TileMatrixSet');
    const projections: Set<EpsgCode> = new Set();
    for (let j = 0; j < tmsTags.length; j++) {
      const epsg = tmsIdToEpsg(tmsTags.item(j)?.textContent ?? '');
      if (epsg == null) continue;
      projections.add(epsg.code);
    }

    if (upperLeft == null || lowerRight == null || upperLeft.length !== 2) continue;
    allLayers.push({
      id,
      name: title.replace('aerial ', ''),
      upperLeft,
      lowerRight,
      projections,
      category,
    } as LayerInfo);
  }

  allLayers.sort((a, b) => a.name.localeCompare(b.name));
  addDefaultLayers(output);
  for (const l of allLayers) output.set(l.id, l);
  return output;
}

function addDefaultLayers(output: Map<string, LayerInfo>): void {
  output.set('aerial', {
    id: 'aerial',
    name: 'Aerial Imagery',
    projections: new Set([EpsgCode.Nztm2000, EpsgCode.Google]),
    category: 'Basemaps',
  } as LayerInfo);

  output.set('topographic::topographic', {
    id: 'topographic::topographic',
    name: 'Topographic',
    projections: new Set([EpsgCode.Google]),
    category: 'Basemaps',
  } as LayerInfo);
}
/** Lookup a projection from either "EPSG:3857" or "WebMercatorQuad" */
function tmsIdToEpsg(id: string): Epsg | null {
  if (id.toLowerCase().startsWith('epsg')) return Epsg.parse(id);
  const tms = TileMatrixSets.find(id);
  if (tms == null) return null;
  return tms.projection;
}

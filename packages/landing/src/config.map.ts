import {
  Epsg,
  EpsgCode,
  GoogleTms,
  ImageFormat,
  locationTransform,
  LocationUrl,
  Nztm2000QuadTms,
  Nztm2000Tms,
  TileMatrixSet,
  TileMatrixSets,
} from '@basemaps/geo';
import { Emitter } from '@servie/events';
import { LngLatBoundsLike } from 'maplibre-gl';

import { ConfigDebug, DebugDefaults, DebugState } from './config.debug.js';
import { Config } from './config.js';
import { mapToBoundingBox } from './tile.matrix.js';
import { ensureBase58, MapLocation, MapOptionType, WindowUrl } from './url.js';

/** Default center point if none provided */
const DefaultCenter: Record<string, MapLocation> = {
  [GoogleTms.identifier]: { lat: -41.88999621, lon: 174.04924373, zoom: 5 },
  [Nztm2000Tms.identifier]: { lat: -41.277848, lon: 174.6763921, zoom: 3 },
  [Nztm2000QuadTms.identifier]: { lat: -41.88999621, lon: 174.04924373, zoom: 3 },
};

export interface FilterDate {
  before?: string;
}
export interface Filter {
  date: FilterDate;
}

export interface MapConfigEvents {
  location: [MapLocation];
  tileMatrix: [TileMatrixSet];

  /** Layer information was changed
   *
   * [ LayerId, Style?, Pipeline? ]
   */
  layer: [string, string | null, string | null, string | null];
  /** should labels be shown */
  labels: [boolean];
  bounds: [LngLatBoundsLike];
  filter: [Filter];
  change: [];
  visibleLayers: [string];
}

export class MapConfig extends Emitter<MapConfigEvents> {
  style: string | null = null;
  layerId = 'aerial';
  tileMatrix: TileMatrixSet = GoogleTms;
  config: string | null = null;
  debug: DebugState = { ...DebugDefaults };
  visibleLayers: string | null = null;
  filter: Filter = { date: { before: undefined } };
  terrain: string | null = null;
  /** Should labels be added to the current layer */
  labels: boolean = false;
  pipeline: string | null = null;
  imageFormat: string | null = null;

  private _layers?: Promise<Map<string, LayerInfo>>;
  get layers(): Promise<Map<string, LayerInfo>> {
    if (this._layers == null) this._layers = loadAllLayers();
    return this._layers;
  }

  get isDebug(): boolean {
    return this.debug.debug === true;
  }

  /** Map location in WGS84 */
  _location?: MapLocation;
  get location(): MapLocation {
    if (this._location == null) {
      window.addEventListener('popstate', () => {
        const location = {
          ...DefaultCenter[this.tileMatrix.identifier],
          // TODO 2023-09 location.hash for storing basemaps locations
          // is deprecated we should remove this at some stage
          ...LocationUrl.fromSlug(window.location.hash),
          ...LocationUrl.fromSlug(window.location.pathname),
        };
        this.setLocation(location);
      });
      this.updateFromUrl();
      this._location = {
        ...DefaultCenter[this.tileMatrix.identifier],
        ...LocationUrl.fromSlug(window.location.hash),
        ...LocationUrl.fromSlug(window.location.pathname),
      };
    }

    return this._location;
  }

  /** Map location in tileMatrix projection */
  get transformedLocation(): MapLocation {
    return this.transformLocation(this.location.lat, this.location.lon, this.location.zoom);
  }

  get isVector(): boolean {
    return this.layerId.startsWith('topographic');
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
    return Config.map.style == null ? `basemaps-${Config.map.layerId}` : `basemaps-${Config.map.style}`;
  }

  updateFromUrl(search: string = window.location.search): void {
    const urlParams = new URLSearchParams(search);
    const style = urlParams.get('s') ?? urlParams.get('style');
    const config = urlParams.get('c') ?? urlParams.get('config');
    const layerId = urlParams.get('i') ?? style ?? 'aerial';
    const terrain = urlParams.get('t') ?? urlParams.get('terrain');
    const labels = urlParams.get('labels');

    const projectionParam = (urlParams.get('p') ?? urlParams.get('tileMatrix') ?? GoogleTms.identifier).toLowerCase();
    let tileMatrix = TileMatrixSets.All.find((f) => f.identifier.toLowerCase() === projectionParam);
    if (tileMatrix == null) tileMatrix = TileMatrixSets.get(Epsg.parse(projectionParam) ?? Epsg.Google);
    if (tileMatrix.identifier === Nztm2000Tms.identifier) tileMatrix = Nztm2000QuadTms;

    const debugChanged = ConfigDebug.fromUrl(this.debug, urlParams);
    if (debugChanged) this.emit('change');

    const previousUrl = MapConfig.toUrl(this);

    this.config = config;
    this.terrain = terrain;
    this.style = style ?? null;
    this.layerId = layerId.startsWith('im_') ? layerId.slice(3) : layerId;
    this.tileMatrix = tileMatrix;
    this.pipeline = urlParams.get('pipeline');
    this.imageFormat = urlParams.get('format');
    if (labels == null) {
      this.labels = layerId === 'aerial' && this.isDebug === false;
    } else {
      this.labels = labels !== 'false';
    }

    if (this.layerId.startsWith('topographic') && this.style == null) this.style = this.layerId;
    this.emit('tileMatrix', this.tileMatrix);
    this.emit('layer', this.layerId, this.style, this.pipeline, this.imageFormat);
    if (previousUrl !== MapConfig.toUrl(this)) this.emit('change');
  }

  static toUrl(opts: MapConfig): string {
    const urlParams = new URLSearchParams();
    if (opts.style) urlParams.append('style', opts.style);
    if (opts.layerId !== 'aerial') urlParams.append('i', opts.layerId);
    if (opts.tileMatrix.identifier !== GoogleTms.identifier) urlParams.append('tileMatrix', opts.tileMatrix.identifier);
    // Config by far the longest so make it the last parameter
    if (opts.config) urlParams.append('config', ensureBase58(opts.config));
    // We don't need to set terrain parameter for debug, as we got debug.terrain parameter to replace
    if (opts.terrain && !opts.isDebug) urlParams.append('terrain', opts.terrain);
    if (opts.labels) urlParams.append('labels', 'true');
    if (opts.pipeline) urlParams.append('pipeline', opts.pipeline);
    if (opts.imageFormat) urlParams.append('format', opts.imageFormat);

    ConfigDebug.toUrl(opts.debug, urlParams);
    return urlParams.toString();
  }

  toTileUrl(
    urlType: MapOptionType,
    tileMatrix = this.tileMatrix,
    layerId = this.layerId,
    style = this.style,
    config = this.config,
    date = this.filter.date,
    pipeline = this.pipeline,
    terrain = this.terrain,
    imageFormat = this.imageFormat,
  ): string {
    return WindowUrl.toTileUrl({ urlType, tileMatrix, layerId, style, config, date, pipeline, terrain, imageFormat });
  }

  getLocation(map: maplibregl.Map): MapLocation {
    const center = map.getCenter();
    if (center == null) throw new Error('Invalid Map location');
    const zoom = Math.floor((map.getZoom() ?? 0) * 10e3) / 10e3;
    const location = Config.map.transformLocation(center.lat, center.lng, zoom);
    const bearing = map.getBearing();
    const pitch = map.getPitch();
    if (bearing !== 0) location.bearing = bearing;
    if (pitch !== 0) location.pitch = pitch;

    const bounds = mapToBoundingBox(map, zoom, Config.map.tileMatrix);
    location.extent = bounds;
    return location;
  }

  transformLocation(lat: number, lon: number, zoom: number): MapLocation {
    return locationTransform({ lat, lon, zoom }, GoogleTms, this.tileMatrix);
  }

  setLocation(l: MapLocation): void {
    if (
      l.lat === this.location.lat &&
      l.lon === this.location.lon &&
      l.zoom === this.location.zoom &&
      l.bearing === this.location.bearing &&
      l.pitch === this.location.pitch &&
      sameExtent(l, this.location)
    ) {
      return;
    }
    this.location.lat = l.lat;
    this.location.lon = l.lon;
    this.location.zoom = l.zoom;
    this.location.bearing = l.bearing;
    this.location.pitch = l.pitch;
    this.location.extent = l.extent;
    this.emit('location', this.location);
    this.emit('change');
  }

  setTerrain(terrain: string | null): void {
    if (this.terrain === terrain) return;
    this.terrain = terrain;
    window.history.pushState(null, '', `?${MapConfig.toUrl(Config.map)}`);
    this.emit('change');
  }

  setTileMatrix(tms: TileMatrixSet): void {
    if (this.tileMatrix.identifier === tms.identifier) return;
    this.emit('tileMatrix', this.tileMatrix);
    this.emit('change');
  }

  setFilterDateRange(dateRange: FilterDate): void {
    if (this.filter.date === dateRange) return;
    this.filter.date = dateRange;
    this.emit('filter', this.filter);
    this.emit('change');
  }

  setLabels(labels: boolean): void {
    if (this.labels === labels) return;
    this.labels = labels;
    window.history.pushState(null, '', `?${MapConfig.toUrl(Config.map)}`);
    this.emit('labels', this.labels);
    this.emit('change');
  }

  setLayerId(
    layer: string,
    style: string | null = null,
    pipeline: string | null = null,
    imageFormat: ImageFormat | null = null,
  ): void {
    if (
      this.layerId === layer &&
      this.style === style &&
      this.pipeline === pipeline &&
      this.imageFormat === imageFormat
    ) {
      return;
    }
    this.layerId = layer;
    this.style = style;
    this.imageFormat = imageFormat;
    this.pipeline = pipeline;
    this.emit('layer', this.layerId, this.style, this.pipeline, this.imageFormat);
    this.emit('change');
  }

  setDebug<T extends keyof DebugState>(key: T, value: DebugState[T] = DebugDefaults[key]): void {
    if (this.debug[key] === value) return;
    this.debug[key] = value;
    this.emit('change');
  }
}

/**
 * Are two location's extents the same
 * @param a location A
 * @param b location B/
 * @returns true if the extents are exactly the same false otherwise
 */
function sameExtent(a: MapLocation, b: MapLocation): boolean {
  if (a.extent == null && b.extent == null) return true;
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  return false;
}

export interface LayerInfo {
  /** Layer id to use when fetching tiles */
  id: string;
  /**
   * Human friendly layer namer
   *
   * @example "Kapiti Coast 0.10m Urban Aerial Photos (2017)"
   */
  title: string;
  /** Layer category */
  category?: string;
  /* Bounding box */
  upperLeft?: [number, number];
  lowerRight?: [number, number];
  /** What projections are enabled for this layer */
  projections: Set<EpsgCode>;
  /** Is a pipeline required for the layer */
  pipeline?: string;
  /** Is a image format required for the layer */
  imageFormat?: ImageFormat;
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
      title: title.replace('aerial ', ''),
      upperLeft,
      lowerRight,
      projections,
      category,
    } as LayerInfo);
  }

  allLayers.sort((a, b) => a.title.localeCompare(b.title));
  addDefaultLayers(output);
  for (const l of allLayers) output.set(l.id, l);
  return output;
}

/**
 * The server currently has no way of telling the client the full list of tilesets it could use
 * so hard code a few default tilesets with their projections
 *
 * @param output layers list to add to
 */
function addDefaultLayers(output: Map<string, LayerInfo>): void {
  const layers: LayerInfo[] = [
    {
      id: 'aerial',
      title: 'Aerial Imagery',
      projections: new Set([EpsgCode.Nztm2000, EpsgCode.Google]),
      category: 'Basemaps',
    },
    {
      id: 'topo-raster::topo-raster-gridded',
      title: 'Topo Maps',
      projections: new Set([EpsgCode.Nztm2000, EpsgCode.Google]),
      category: 'Basemaps',
    },
    {
      id: 'topo-raster::topo-raster',
      title: 'Topo Gridless Maps',
      projections: new Set([EpsgCode.Nztm2000, EpsgCode.Google]),
      category: 'Basemaps',
    },
    {
      id: 'topographic::topographic',
      title: 'Topographic',
      projections: new Set([EpsgCode.Google]),
      category: 'Basemaps',
    },
    {
      id: 'topographic::topolite',
      title: 'Topolite',
      projections: new Set([EpsgCode.Google]),
      category: 'Basemaps',
    },
    {
      id: 'hillshade-igor',
      title: 'Hillshade Igor DEM',
      projections: new Set([EpsgCode.Nztm2000, EpsgCode.Google]),
      category: 'Basemaps - Hillshade',
    },
    {
      id: 'hillshade-igor-dsm',
      title: 'Hillshade Igor DSM',
      projections: new Set([EpsgCode.Nztm2000, EpsgCode.Google]),
      category: 'Basemaps - Hillshade',
    },
    {
      id: 'hillshade',
      title: 'Hillshade Standard DEM',
      projections: new Set([EpsgCode.Nztm2000, EpsgCode.Google]),
      category: 'Elevation',
    },
    {
      id: 'hillshade-dsm',
      title: 'Hillshade Standard DSM',
      projections: new Set([EpsgCode.Nztm2000, EpsgCode.Google]),
      category: 'Elevation',
    },
    {
      id: 'elevation',
      title: 'Elevation DEM',
      projections: new Set([EpsgCode.Google]),
      category: 'Basemaps - Elevation',
      pipeline: 'terrain-rgb',
      imageFormat: 'png',
    },
    {
      id: 'elevation-dsm',
      title: 'Elevation DSM',
      projections: new Set([EpsgCode.Google]),
      category: 'Basemaps - Elevation',
      pipeline: 'terrain-rgb',
      imageFormat: 'png',
    },
    {
      id: 'scanned-aerial-imagery-pre-1990-01-01',
      title: 'Scanned Aerial Imagery pre 1 January 1990',
      projections: new Set([EpsgCode.Nztm2000, EpsgCode.Google]),
      category: 'Basemaps - Scanned Aerial Imagery',
    },
    {
      id: 'scanned-aerial-imagery-post-1989-12-31',
      title: 'Scanned Aerial Imagery post 31 December 1989',
      projections: new Set([EpsgCode.Nztm2000, EpsgCode.Google]),
      category: 'Basemaps - Scanned Aerial Imagery',
    },
  ];

  for (const l of layers) output.set(l.id, l);
}
/** Lookup a projection from either "EPSG:3857" or "WebMercatorQuad" */
function tmsIdToEpsg(id: string): Epsg | null {
  if (id.toLowerCase().startsWith('epsg')) return Epsg.parse(id);
  const tms = TileMatrixSets.find(id);
  if (tms == null) return null;
  return tms.projection;
}

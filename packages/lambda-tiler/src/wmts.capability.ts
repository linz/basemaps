import {
  ConfigImagery,
  ConfigLayer,
  ConfigTileSet,
  ConfigTileSetRasterOutput,
  standardizeLayerName,
  TileSetType,
} from '@basemaps/config';
import { BoundingBox, Bounds, GoogleTms, ImageFormat, Projection, TileMatrixSet, WmtsProvider } from '@basemaps/geo';
import { toQueryString, V, VNodeElement } from '@basemaps/shared';
import { ImageFormatOrder } from '@basemaps/tiler';
import { BBox } from '@linzjs/geojson';

const CapabilitiesAttrs = {
  xmlns: 'http://www.opengis.net/wmts/1.0',
  'xmlns:ows': 'http://www.opengis.net/ows/1.1',
  'xmlns:xlink': 'http://www.w3.org/1999/xlink',
  'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
  'xmlns:gml': 'http://www.opengis.net/gml',
  'xsi:schemaLocation':
    'http://www.opengis.net/wmts/1.0 http://schemas.opengis.net/wmts/1.0/wmtsGetCapabilities_response.xsd',
  version: '1.0.0',
};

function wgs84Extent(tileMatrix: TileMatrixSet, bbox: BoundingBox): BBox {
  return Projection.get(tileMatrix).boundsToWgs84BoundingBox(bbox);
}

/** Number of decimal places to use in lat lng */
const LngLatPrecision = 6;
const MeterPrecision = 4;

function formatCoords(x: number, precision: number): string {
  return Number(x.toFixed(precision)).toString();
}

/** Format a bounding box XY as `${x} ${y}` while restricting to precision decimal places */
function formatBbox(x: number, y: number, precision: number): string {
  return `${formatCoords(x, precision)} ${formatCoords(y, precision)}`;
}
export interface WmtsBuilderParams {
  /** Base URL for tile server */
  httpBase: string;
  /** API key to append to all resource urls */
  apiKey?: string;
  /** Config location */
  config?: string | null;
  /** Default pipeline to use */
  pipeline?: string;
}

export class WmtsBuilder {
  httpBase: string;
  apiKey?: string;
  config?: string | null;
  pipeline?: string;
  filters?: Record<string, string | undefined>;

  /** All the imagery used by the tileSet and tileMatrixes */
  imagery: Map<string, ConfigImagery> = new Map();
  formats: ImageFormat[] = [];

  tileMatrixSets = new Map<string, TileMatrixSet>();

  constructor(params: WmtsBuilderParams) {
    this.httpBase = params.httpBase;
    this.apiKey = params.apiKey;
    this.config = params.config;
    this.pipeline = params.pipeline;
  }

  addImagery(...imagery: ConfigImagery[]): void {
    for (const im of imagery) this.imagery.set(im.id, im);
  }

  addTileMatrix(...tileMatrix: TileMatrixSet[]): void {
    for (const tms of tileMatrix) this.tileMatrixSets.set(tms.identifier, tms);
  }

  addFormats(...formats: ImageFormat[]): void {
    for (const format of formats) this.formats.push(format);
  }

  getFormats(restrictTo?: ImageFormat[]): ImageFormat[] {
    if (restrictTo) {
      if (this.formats.length === 0) return restrictTo;
      const filtered = this.formats.filter((f) => restrictTo.includes(f));
      if (filtered.length === 0) return restrictTo;
      return filtered;
    }
    if (this.formats.length) return this.formats;
    return ImageFormatOrder;
  }

  getMatrixSets(tileSet: ConfigTileSet): Set<TileMatrixSet> {
    const matrixSets = new Set<TileMatrixSet>();
    for (const tms of this.tileMatrixSets.values()) {
      if (tileSet.layers.find((f) => f[tms.projection.code] != null)) {
        matrixSets.add(tms);
      }
    }
    return matrixSets;
  }

  buildKeywords(tileSet: { category?: string }): VNodeElement {
    if (tileSet.category == null) return V('ows:Keywords');
    return V('ows:Keywords', [V('ows:Keyword', tileSet.category)]);
  }

  buildWgs84BoundingBox(tms: TileMatrixSet, layers: Bounds[]): VNodeElement {
    let bbox: BBox | null = null;

    if (layers.length > 0) {
      let bounds = layers[0];
      for (let i = 1; i < layers.length; i++) {
        bounds = bounds.union(layers[i]);
      }

      // If imagery is outside of the bounds of the tileMatrix, fall back to the tileMatrix extent for the bounds
      if (!tms.extent.containsBounds(bounds)) {
        bbox = wgs84Extent(tms, tms.extent);
      } else {
        bbox = wgs84Extent(tms, bounds);
      }
    }

    // No layers provided assume extent is the size of the tile matrix set :shrug: ?
    if (bbox == null) bbox = wgs84Extent(tms, tms.extent);

    // If east is less than west, then this has crossed the anti meridian, so cover the entire globe
    if (bbox[2] < bbox[0]) {
      bbox[0] = -180;
      bbox[2] = 180;
    }

    return V('ows:WGS84BoundingBox', { crs: 'urn:ogc:def:crs:OGC:2:84' }, [
      V('ows:LowerCorner', formatBbox(bbox[0], bbox[1], LngLatPrecision)),
      V('ows:UpperCorner', formatBbox(bbox[2], bbox[3], LngLatPrecision)),
    ]);
  }

  /** Combine all the bounds of the imagery inside the layers into a extent for the imagery set */
  buildBoundingBoxFromImagery(tms: TileMatrixSet, layers: ConfigLayer[]): VNodeElement | null {
    let bounds: Bounds | null = null;
    for (const layer of layers) {
      const imgId = layer[tms.projection.code];
      if (imgId == null) continue;
      const img = this.imagery.get(imgId);
      if (img == null) continue;
      if (bounds == null) bounds = Bounds.fromJson(img.bounds);
      else bounds = bounds.union(Bounds.fromJson(img.bounds));
    }
    if (bounds == null) return null;

    // If imagery is outside of the bounds of the tileMatrix, fall back to the tileMatrix extent for the bounds
    if (!tms.extent.containsBounds(bounds)) bounds = tms.extent;

    const bbox = bounds.toBbox();

    return V('ows:BoundingBox', { crs: tms.projection.toUrn() }, [
      V('ows:LowerCorner', formatBbox(bbox[tms.indexX], bbox[tms.indexY], MeterPrecision)),
      V('ows:UpperCorner', formatBbox(bbox[tms.indexX + 2], bbox[tms.indexY + 2], MeterPrecision)),
    ]);
  }

  buildStyle(): VNodeElement {
    return V('Style', { isDefault: 'true' }, [V('ows:Title', 'Default Style'), V('ows:Identifier', 'default')]);
  }

  buildResourceUrl(tileSetId: string, suffix: string, pipeline?: string): VNodeElement {
    return V('ResourceURL', {
      format: 'image/' + suffix,
      resourceType: 'tile',
      template: this.buildTileUrl(tileSetId, suffix, pipeline),
    });
  }

  buildTileUrl(tileSetId: string, suffix: string, pipeline?: string): string {
    // TODO this should restrict the output formats to supported formats in pipelines
    const query = { api: this.apiKey, config: this.config, pipeline };

    return [
      this.httpBase,
      'v1',
      'tiles',
      tileSetId,
      '{TileMatrixSet}',
      '{TileMatrix}',
      '{TileCol}',
      `{TileRow}.${suffix}${toQueryString(query)}`,
    ].join('/');
  }

  buildTileMatrixLink(tileSet: ConfigTileSet): VNodeElement[] {
    const matrixSetNodes: VNodeElement[] = [];
    for (const tms of this.tileMatrixSets.values()) {
      if (tileSet.layers.find((f) => f[tms.projection.code] != null)) {
        matrixSetNodes.push(V('TileMatrixSetLink', [V('TileMatrixSet', tms.identifier)]));
      }
    }
    return matrixSetNodes;
  }

  buildLayerFromImagery(layer: ConfigLayer): VNodeElement | null {
    const matrixSets = new Set<TileMatrixSet>();
    const matrixSetNodes: VNodeElement[] = [];
    for (const tms of this.tileMatrixSets.values()) {
      const imdIg = layer[tms.projection.code];
      if (imdIg == null) continue;
      const img = this.imagery.get(imdIg);
      if (img == null) continue;
      matrixSetNodes.push(V('TileMatrixSetLink', [V('TileMatrixSet', tms.identifier)]));
      matrixSets.add(tms);
    }

    const layerNameId = standardizeLayerName(layer.name);
    const matrixSetList = [...matrixSets.values()];
    const firstMatrix = matrixSetList[0];
    if (firstMatrix == null) return null;
    const firstImg = this.imagery.get(layer[firstMatrix.projection.code] ?? '');
    if (firstImg == null) return null;

    return V('Layer', [
      V('ows:Title', layer.title),
      V('ows:Abstract', ''),
      V('ows:Identifier', layerNameId),
      this.buildKeywords(firstImg),
      ...matrixSetList.map((tms) => {
        return this.buildBoundingBoxFromImagery(tms, [layer]);
      }),
      this.buildWgs84BoundingBox(firstMatrix, [Bounds.fromJson(firstImg.bounds)]),
      this.buildStyle(),
      ...this.getFormats().map((fmt) => V('Format', 'image/' + fmt)),
      ...matrixSetNodes,
      ...this.getFormats().map((fmt) => this.buildResourceUrl(layerNameId, fmt)),
    ]);
  }
}

export interface WmtsCapabilitiesParams {
  provider?: WmtsProvider;
  /** Tileset to export into WMTS */
  tileSet: ConfigTileSet;
  /** List of tile matrixes to output */
  tileMatrix: TileMatrixSet[];
  /** All the imagery used by the tileSet and tileMatrixes */
  imagery: Map<string, ConfigImagery>;
  /** Limit the output to the following image formats other wise @see ImageFormatOrder */
  formats: ImageFormat[];
  /** Specific layers to add to the WMTS */
  layers?: ConfigLayer[];
  /** Default output pipeline to use */
  pipeline?: string | null;
}

/**
 * WMTS Capabilities Builder
 *
 * /v1/tiles/:tileSet/:tileMatrix/WMTSCapabilities.xml
 * /v1/tiles/:tileSet/WMTSCapabilities.xml
 * /v1/tiles/WMTSCapabilities.xml
 *
 * @example
 *
 */
export class WmtsCapabilities extends WmtsBuilder {
  minZoom = 0;
  maxZoom = 32;
  /** Wmts tileSet layer and imagery layers information */
  tileSet?: ConfigTileSet;
  configLayers?: ConfigLayer[];

  /** Wmts Provider information */
  provider?: WmtsProvider;

  constructor(params: WmtsBuilderParams) {
    super(params);
  }

  addTileSet(tileSet: ConfigTileSet): void {
    this.tileSet = tileSet;
  }

  addLayers(configLayers?: ConfigLayer[]): void {
    this.configLayers = configLayers;
  }

  addProvider(provider?: WmtsProvider): void {
    this.provider = provider;
  }

  addPipeline(pipeline: string): void {
    this.pipeline = pipeline;
  }

  toProviderVNode(provider?: WmtsProvider): VNodeElement[] | [] {
    if (provider == null) return [];
    const { serviceIdentification, serviceProvider } = provider;
    const { contact } = serviceProvider;
    return [
      V('ows:ServiceIdentification', [
        V('ows:Title', serviceIdentification.title),
        V('ows:Abstract', serviceIdentification.description),
        V('ows:ServiceType', 'OGC WMTS'),
        V('ows:ServiceTypeVersion', '1.0.0'),
        V('ows:Fees', serviceIdentification.fees),
        V('ows:AccessConstraints', serviceIdentification.accessConstraints),
      ]),

      V('ows:ServiceProvider', [
        V('ows:ProviderName', serviceProvider.name),
        V('ows:ProviderSite', { 'xlink:href': serviceProvider.site }),
        V('ows:ServiceContact', [
          V('ows:IndividualName', contact.individualName),
          V('ows:PositionName', contact.position),
          V('ows:ContactInfo', [
            V('ows:Phone', [V('ows:Voice', contact.phone)]),
            V('ows:Address', [
              V('ows:DeliveryPoint', contact.address.deliveryPoint),
              V('ows:City', contact.address.city),
              V('ows:PostalCode', contact.address.postalCode),
              V('ows:Country', contact.address.country),
              V('ows:ElectronicMailAddress', contact.address.email),
            ]),
          ]),
        ]),
      ]),
    ];
  }

  toLayerVNode(tileSet: ConfigTileSet): VNodeElement[] {
    const matrixSets = this.getMatrixSets(tileSet);
    const matrixSetList = [...matrixSets.values()];
    const firstMatrix = matrixSetList[0];
    if (firstMatrix == null) throw new Error('No matrix sets found for layer ' + tileSet.name);

    // Prefer using the web mercator tms for bounds
    const webMercatorOrFirst = matrixSetList.find((f) => f.identifier === GoogleTms.identifier) ?? firstMatrix;
    const bounds: Bounds[] = [];
    for (const l of tileSet.layers) {
      const img = this.imagery.get(l[webMercatorOrFirst.projection.code] ?? '');
      if (img == null) continue;
      bounds.push(Bounds.fromJson(img.bounds));
    }

    const layers: VNodeElement[] = [];

    const pipelines = this.getPipelines(tileSet, this.pipeline);

    const layerNameId = standardizeLayerName(tileSet.name);

    for (const pipeline of pipelines) {
      const formats = this.getFormats(pipeline.format);
      const layerId = pipeline.default ? layerNameId : `${layerNameId}_${pipeline.name}`;
      const layerTitle = pipeline.default ? tileSet.title : `${tileSet.title} ${pipeline.title}`;

      const layer = V('Layer', [
        V('ows:Title', layerTitle),
        V('ows:Abstract', tileSet.description ?? ''),
        V('ows:Identifier', layerId),
        this.buildKeywords(tileSet),
        ...[...matrixSets.values()].map((tms) => this.buildBoundingBoxFromImagery(tms, tileSet.layers)),
        this.buildWgs84BoundingBox(webMercatorOrFirst, bounds),
        this.buildStyle(),
        ...formats.map((fmt) => V('Format', 'image/' + fmt)),
        ...this.buildTileMatrixLink(tileSet),
        ...formats.map((fmt) => this.buildResourceUrl(layerNameId, fmt, pipeline.default ? undefined : pipeline.name)),
      ]);
      layers.push(layer);
    }

    return layers;
  }

  getPipelines(tileSet: ConfigTileSet, pipeline?: string): ConfigTileSetRasterOutput[] {
    if (tileSet.type !== TileSetType.Raster) return [];

    if (tileSet.outputs == null) return [{ name: 'rgba', title: 'RGBA', default: true }];

    if (pipeline) return tileSet.outputs.filter((f) => f.name === pipeline);

    return tileSet.outputs;
  }

  toAllImageryLayersVNode(configLayers?: ConfigLayer[]): VNodeElement[] {
    if (configLayers == null) return [];
    const layersVNode: VNodeElement[] = [];
    const layerByName = new Map<string, ConfigLayer>();
    // Dedupe the layers by unique name
    for (const img of configLayers) layerByName.set(standardizeLayerName(img.name), img);
    const orderedLayers = Array.from(layerByName.values()).sort((a, b) =>
      (a.title ?? a.name).localeCompare(b.title ?? b.name),
    );
    for (const img of orderedLayers) {
      const layer = this.buildLayerFromImagery(img);
      if (layer) layersVNode.push(layer);
    }
    return layersVNode;
  }

  buildTileMatrixSet(tms: TileMatrixSet): VNodeElement {
    return V('TileMatrixSet', [
      V('ows:Title', tms.def.title),
      tms.def.abstract ? V('ows:Abstract', tms.def.abstract) : null,
      V('ows:Identifier', tms.identifier),
      V('ows:SupportedCRS', tms.projection.toUrn()),
      tms.def.wellKnownScaleSet ? V('WellKnownScaleSet', tms.def.wellKnownScaleSet) : null,
      ...tms.def.tileMatrix.slice(this.minZoom, this.maxZoom + 1).map((c) => {
        return V('TileMatrix', [
          V('ows:Identifier', c.identifier),
          V('ScaleDenominator', c.scaleDenominator),
          V('TopLeftCorner', c.topLeftCorner.join(' ')),
          V('TileWidth', c.tileWidth),
          V('TileHeight', c.tileHeight),
          V('MatrixWidth', c.matrixWidth),
          V('MatrixHeight', c.matrixHeight),
        ]);
      }),
    ]);
  }

  toVNode(): VNodeElement {
    if (this.tileSet == null) throw new Error('No Tileset provided');
    // Prepare provider vNode if exists
    const provider = this.toProviderVNode(this.provider);

    // Build TileSet Layer VNodes
    const layers: VNodeElement[] = [];
    layers.push(...this.toLayerVNode(this.tileSet));
    const contents = layers.concat(this.toAllImageryLayersVNode(this.configLayers));

    // Build TileMatrix Sets vNodes
    for (const tms of this.tileMatrixSets.values()) contents.push(this.buildTileMatrixSet(tms));

    return V('Capabilities', CapabilitiesAttrs, [...provider, V('Contents', contents)]);
  }

  toXml(): string {
    return '<?xml version="1.0" encoding="utf-8"?>\n' + this.toVNode().toString();
  }

  fromParams(params: WmtsCapabilitiesParams): void {
    for (const tileMatrix of params.tileMatrix) this.addTileMatrix(tileMatrix);
    for (const im of params.imagery.values()) this.addImagery(im);
    for (const format of params.formats) this.addFormats(format);

    // Build wmts capabilities
    this.addTileSet(params.tileSet);
    this.addLayers(params.layers);
    this.addProvider(params.provider);
    if (params.pipeline) this.addPipeline(params.pipeline);
  }
}

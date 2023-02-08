import { ConfigImagery, ConfigLayer, ConfigTileSet, standardizeLayerName } from '@basemaps/config';
import { Bounds, GoogleTms, ImageFormat, TileMatrixSet, WmtsProvider } from '@basemaps/geo';
import { Projection, toQueryString, V, VNodeElement } from '@basemaps/shared';
import { ImageFormatOrder } from '@basemaps/tiler';
import { BoundingBox } from '@cogeotiff/core';
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

export interface WmtsCapabilitiesParams {
  /** Base URL for tile server */
  httpBase: string;
  provider?: WmtsProvider;
  /** Tileset to export into WMTS */
  tileSet: ConfigTileSet;
  /** List of tile matrixes to output */
  tileMatrix: TileMatrixSet[];
  /** All the imagery used by the tileSet and tileMatrixes */
  imagery: Map<string, ConfigImagery>;
  /** API key to append to all resource urls */
  apiKey?: string;
  /** Limit the output to the following image formats other wise @see ImageFormatOrder */
  formats?: ImageFormat[] | null;
  /** Config location */
  config?: string | null;
  /** Specific layers to add to the WMTS */
  layers?: ConfigLayer[] | null;
  /** Specific DateRange filter for the wmts layers */
  filters?: Record<string, string | undefined>;
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

export class WmtsCapabilities {
  httpBase: string;
  provider?: WmtsProvider;
  tileSet: ConfigTileSet;
  apiKey?: string;
  config?: string | null;
  tileMatrixSets = new Map<string, TileMatrixSet>();
  imagery: Map<string, ConfigImagery>;
  formats: ImageFormat[];
  filters?: Record<string, string | undefined>;

  minZoom = 0;
  maxZoom = 32;
  layers: ConfigLayer[] | null | undefined;

  constructor(params: WmtsCapabilitiesParams) {
    this.httpBase = params.httpBase;
    this.provider = params.provider;
    this.tileSet = params.tileSet;
    this.config = params.config;
    for (const tms of params.tileMatrix) this.tileMatrixSets.set(tms.identifier, tms);
    this.apiKey = params.apiKey;
    this.formats = params.formats ?? ImageFormatOrder;
    this.imagery = params.imagery;
    this.layers = params.layers;
    this.filters = params.filters;
  }

  buildWgs84BoundingBox(tms: TileMatrixSet, layers: Bounds[]): VNodeElement {
    let bbox: BBox;
    if (layers.length > 0) {
      let bounds = layers[0];
      for (let i = 1; i < layers.length; i++) {
        bounds = bounds.union(layers[i]);
      }
      bbox = wgs84Extent(tms, bounds.toJson());
    } else {
      // No layers provided assume extent is the size of the tile matrix set :shrug: ?
      bbox = wgs84Extent(tms, tms.extent);
    }

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
    let bounds;
    for (const layer of layers) {
      const imgId = layer[tms.projection.code];
      if (imgId == null) continue;
      const img = this.imagery.get(imgId);
      if (img == null) continue;
      if (bounds == null) bounds = Bounds.fromJson(img.bounds);
      else bounds = bounds.union(Bounds.fromJson(img.bounds));
    }
    if (bounds == null) return null;

    const bbox = bounds.toBbox();
    return V('ows:BoundingBox', { crs: tms.projection.toUrn() }, [
      V('ows:LowerCorner', formatBbox(bbox[tms.indexX], bbox[tms.indexY], MeterPrecision)),
      V('ows:UpperCorner', formatBbox(bbox[tms.indexX + 2], bbox[tms.indexY + 2], MeterPrecision)),
    ]);
  }

  buildProvider(): VNodeElement[] {
    if (this.provider == null) return [];
    const { serviceIdentification, serviceProvider } = this.provider;
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

  buildTileUrl(tileSetId: string, suffix: string, AddFilter = false): string {
    let query = { api: this.apiKey, config: this.config };
    if (AddFilter) query = { api: this.apiKey, config: this.config, ...this.filters };

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

  buildResourceUrl(tileSetId: string, suffix: string, AddFilter = false): VNodeElement {
    return V('ResourceURL', {
      format: 'image/' + suffix,
      resourceType: 'tile',
      template: this.buildTileUrl(tileSetId, suffix, AddFilter),
    });
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
      V('ows:Title', layer.title ?? layerNameId),
      V('ows:Abstract', ''),
      V('ows:Identifier', layerNameId),
      this.buildKeywords(firstImg),
      ...matrixSetList.map((tms) => {
        return this.buildBoundingBoxFromImagery(tms, [layer]);
      }),
      this.buildWgs84BoundingBox(firstMatrix, [Bounds.fromJson(firstImg.bounds)]),
      this.buildStyle(),
      ...this.formats.map((fmt) => V('Format', 'image/' + fmt)),
      ...matrixSetNodes,
      ...this.formats.map((fmt) => this.buildResourceUrl(layerNameId, fmt)),
    ]);
  }

  buildLayer(layer: ConfigTileSet): VNodeElement {
    const matrixSets = new Set<TileMatrixSet>();
    const matrixSetNodes: VNodeElement[] = [];
    for (const tms of this.tileMatrixSets.values()) {
      if (layer.layers.find((f) => f[tms.projection.code] != null)) {
        matrixSetNodes.push(V('TileMatrixSetLink', [V('TileMatrixSet', tms.identifier)]));
        matrixSets.add(tms);
      }
    }
    const layerNameId = standardizeLayerName(layer.name);
    const matrixSetList = [...matrixSets.values()];
    const firstMatrix = matrixSetList[0];
    if (firstMatrix == null) throw new Error('No matrix sets found for layer ' + layer.name);

    // Prefer using the web mercator tms for bounds
    const webMercatorOrFirst = matrixSetList.find((f) => f.identifier === GoogleTms.identifier) ?? firstMatrix;
    const bounds: Bounds[] = [];
    for (const l of layer.layers) {
      const img = this.imagery.get(l[webMercatorOrFirst.projection.code] ?? '');
      if (img == null) continue;
      bounds.push(Bounds.fromJson(img.bounds));
    }

    return V('Layer', [
      V('ows:Title', layer.title ?? layerNameId),
      V('ows:Abstract', layer.description ?? ''),
      V('ows:Identifier', layerNameId),
      this.buildKeywords(layer),
      ...[...matrixSets.values()].map((tms) => this.buildBoundingBoxFromImagery(tms, layer.layers)),
      this.buildWgs84BoundingBox(webMercatorOrFirst, bounds),
      this.buildStyle(),
      ...this.formats.map((fmt) => V('Format', 'image/' + fmt)),
      ...matrixSetNodes,
      ...this.formats.map((fmt) => this.buildResourceUrl(layerNameId, fmt, true)),
    ]);
  }

  buildKeywords(tileSet: { category?: string }): VNodeElement {
    if (tileSet.category == null) return V('ows:Keywords');
    return V('ows:Keywords', [V('ows:Keyword', tileSet.category)]);
  }

  buildStyle(): VNodeElement {
    return V('Style', { isDefault: 'true' }, [V('ows:Title', 'Default Style'), V('ows:Identifier', 'default')]);
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
    const layers: (VNodeElement | null)[] = [];
    layers.push(this.buildLayer(this.tileSet));

    if (this.layers) {
      const layerByName = new Map<string, ConfigLayer>();
      // Dedupe the layers by unique name
      for (const img of this.layers) layerByName.set(standardizeLayerName(img.name), img);
      const orderedLayers = Array.from(layerByName.values()).sort((a, b) =>
        (a.title ?? a.name).localeCompare(b.title ?? b.name),
      );
      for (const img of orderedLayers) layers.push(this.buildLayerFromImagery(img));
    }

    for (const tms of this.tileMatrixSets.values()) layers.push(this.buildTileMatrixSet(tms));

    return V('Capabilities', CapabilitiesAttrs, [...this.buildProvider(), V('Contents', layers)]);
  }

  toXml(): string {
    return '<?xml version="1.0" encoding="utf-8"?>\n' + this.toVNode().toString();
  }
}

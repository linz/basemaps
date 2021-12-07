import { ConfigProvider } from '@basemaps/config';
import { Bounds, Nztm2000QuadTms, TileMatrixSet, WmtsProvider } from '@basemaps/geo';
import { Projection, V, VNodeElement } from '@basemaps/shared';
import { ImageFormatOrder } from '@basemaps/tiler';
import { BBox, Wgs84 } from '@linzjs/geojson';
import { TileSetRaster } from './tile.set.raster.js';

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

function wgs84Extent(layer: TileSetRaster): BBox {
  return Projection.get(layer.tileMatrix).boundsToWgs84BoundingBox(layer.extent);
}

/**
 * Default the tile matrix id to the projection of the TileMatrixSet
 */
function getTileMatrixId(tileMatrix: TileMatrixSet): string {
  // TODO this should really change everything to identifier
  if (tileMatrix.identifier === Nztm2000QuadTms.identifier) return Nztm2000QuadTms.identifier;
  return tileMatrix.projection.toEpsgString();
}

export class WmtsCapabilities {
  httpBase: string;
  provider: WmtsProvider;

  layers: Map<string, TileSetRaster[]> = new Map();

  apiKey?: string;
  tileMatrixSets = new Map<string, TileMatrixSet>();

  constructor(httpBase: string, provider: WmtsProvider, layers: TileSetRaster[], apiKey?: string) {
    this.httpBase = httpBase;
    this.provider = provider;

    for (const layer of layers) {
      // TODO is grouping by name the best option
      let existing = this.layers.get(layer.fullName);
      if (existing == null) {
        existing = [];
        this.layers.set(layer.fullName, existing);
      }
      // TODO should a error be thrown here if the projection is invalid
      existing.push(layer);

      this.tileMatrixSets.set(layer.tileMatrix.identifier, layer.tileMatrix);
    }
    this.apiKey = apiKey;
  }

  buildWgs84BoundingBox(layers: TileSetRaster[], tagName = 'ows:WGS84BoundingBox'): VNodeElement {
    let bbox = wgs84Extent(layers[0]);
    for (let i = 1; i < layers.length; ++i) {
      bbox = Wgs84.union(bbox, wgs84Extent(layers[i]));
    }

    return V(
      tagName,
      { crs: 'urn:ogc:def:crs:OGC:2:84' },
      bbox[2] > 180
        ? [V('ows:LowerCorner', `${bbox[0]} ${bbox[1]}`), V('ows:UpperCorner', `180 ${bbox[3]}`)]
        : [V('ows:LowerCorner', `${bbox[0]} ${bbox[1]}`), V('ows:UpperCorner', `${bbox[2]} ${bbox[3]}`)],
    );
  }

  buildBoundingBox(tms: TileMatrixSet, extent: Bounds): VNodeElement {
    const bbox = extent.toBbox();
    return V('ows:BoundingBox', { crs: tms.projection.toUrn() }, [
      V('ows:LowerCorner', `${bbox[tms.indexX]} ${bbox[tms.indexY]}`),
      V('ows:UpperCorner', `${bbox[tms.indexX + 2]} ${bbox[tms.indexY + 2]}`),
    ]);
  }

  buildProvider(): VNodeElement[] {
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

  buildTileUrl(tileSet: TileSetRaster, suffix: string): string {
    const apiSuffix = this.apiKey ? `?api=${this.apiKey}` : '';
    return [
      this.httpBase,
      'v1',
      'tiles',
      tileSet.fullName,
      '{TileMatrixSet}',
      '{TileMatrix}',
      '{TileCol}',
      `{TileRow}.${suffix}${apiSuffix}`,
    ].join('/');
  }

  buildResourceUrl(tileSet: TileSetRaster, suffix: string): VNodeElement {
    return V('ResourceURL', {
      format: 'image/' + suffix,
      resourceType: 'tile',
      template: this.buildTileUrl(tileSet, suffix),
    });
  }

  buildLayer(layers: TileSetRaster[]): VNodeElement {
    const matrixSets = new Set<string>();
    const matrixSetNodes: VNodeElement[] = [];
    for (const layer of layers) {
      if (matrixSets.has(layer.tileMatrix.identifier)) continue;
      matrixSets.add(layer.tileMatrix.identifier);
      matrixSetNodes.push(V('TileMatrixSetLink', [V('TileMatrixSet', getTileMatrixId(layer.tileMatrix))]));
    }

    const [firstLayer] = layers;
    return V('Layer', [
      V('ows:Title', firstLayer.title),
      V('ows:Abstract', firstLayer.description),
      V('ows:Identifier', firstLayer.fullName),
      ...layers.map((layer) => this.buildBoundingBox(layer.tileMatrix, layer.extent)),
      this.buildWgs84BoundingBox(layers),
      this.buildStyle(),
      ...ImageFormatOrder.map((fmt) => V('Format', 'image/' + fmt)),
      ...matrixSetNodes,
      ...ImageFormatOrder.map((fmt) => this.buildResourceUrl(firstLayer, fmt)),
    ]);
  }

  buildStyle(): VNodeElement {
    return V('Style', { isDefault: 'true' }, [V('ows:Title', 'Default Style'), V('ows:Identifier', 'default')]);
  }

  buildTileMatrixSet(tms: TileMatrixSet): VNodeElement {
    return V('TileMatrixSet', [
      V('ows:Title', tms.def.title),
      tms.def.abstract ? V('ows:Abstract', tms.def.abstract) : null,
      V('ows:Identifier', getTileMatrixId(tms)),
      V('ows:SupportedCRS', tms.projection.toUrn()),
      tms.def.wellKnownScaleSet ? V('WellKnownScaleSet', tms.def.wellKnownScaleSet) : null,
      ...tms.def.tileMatrix.map((c) => {
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
    const layers: VNodeElement[] = [];
    for (const tileSets of this.layers.values()) {
      layers.push(this.buildLayer(tileSets));
    }
    for (const tms of this.tileMatrixSets.values()) layers.push(this.buildTileMatrixSet(tms));

    return V('Capabilities', CapabilitiesAttrs, [...this.buildProvider(), V('Contents', layers)]);
  }

  toString(): string {
    return '<?xml version="1.0"?>\n' + this.toVNode().toString();
  }

  static toXml(httpBase: string, provider: ConfigProvider, tileSet: TileSetRaster[], apiKey?: string): string {
    return new WmtsCapabilities(httpBase, provider, tileSet, apiKey).toString();
  }
}

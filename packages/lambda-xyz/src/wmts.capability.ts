import { Epsg, TileMatrixSet } from '@basemaps/geo';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Nztm2000Tms } from '@basemaps/geo/build/tms/nztm2000';
import { TileMetadataProviderRecord, V, VNodeElement } from '@basemaps/lambda-shared';
import { ImageFormatOrder } from '@basemaps/tiler';
import { TileSet } from './tile.set';

function getTileMatrixSet(projection: Epsg): TileMatrixSet[] | null {
    switch (projection) {
        case Epsg.Google:
            return [GoogleTms];
        case Epsg.Nztm2000:
            return [Nztm2000Tms];
        default:
            return null;
    }
}

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

export class WmtsCapabilities {
    httpBase: string;
    provider: TileMetadataProviderRecord;
    tileSet: TileSet;
    apiKey?: string;

    constructor(httpBase: string, provider: TileMetadataProviderRecord, tileSet: TileSet, apiKey?: string) {
        this.httpBase = httpBase;
        this.provider = provider;
        this.tileSet = tileSet;
        this.apiKey = apiKey;
    }

    buildBoundingBox(tms: TileMatrixSet): VNodeElement {
        return V('ows:BoundingBox', { crs: tms.projection.toUrn() }, [
            V('ows:LowerCorner', tms.def.boundingBox.lowerCorner.join(' ')),
            V('ows:UpperCorner', tms.def.boundingBox.upperCorner.join(' ')),
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
                V('ows:ServiceTypeVersion', '1.0.' + this.provider.version),
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

    buildResourceUrl(suffix: string): VNodeElement {
        return V('ResourceURL', {
            format: 'image/' + suffix,
            resourceType: 'tile',
            template: `${this.httpBase}/v1/tiles/${this.tileSet.taggedName}/${
                this.tileSet.projection
            }/{TileMatrix}/{TileCol}/{TileRow}.${suffix}${this.apiKey ? '?api=' + this.apiKey : ''}`,
        });
    }

    buildLayer(tms: TileMatrixSet[]): VNodeElement {
        return V('Layer', [
            V('ows:Title', this.tileSet.title),
            V('ows:Abstract', this.tileSet.description),
            ...tms.map((c) => this.buildBoundingBox(c)),
            ...tms.map((c) => V('TileMatrixSetLink', [V('TileMatrixSet', c.def.identifier)])),
            ...ImageFormatOrder.map((fmt) => V('Format', 'image/' + fmt)),
            ...ImageFormatOrder.map((fmt) => this.buildResourceUrl(fmt)),
        ]);
    }

    buildTileMatrixSet(tms: TileMatrixSet): VNodeElement {
        return V('TileMatrixSet', [
            V('ows:Title', tms.def.title),
            tms.def.abstract ? V('ows:Abstract', tms.def.abstract) : null,
            V('ows:Identifier', tms.def.identifier),
            V('ows:SupportedCRS', tms.projection.toUrn()),
            tms.def.wellKnownScaleSet ? V('ows:WellKnownScaleSet', tms.def.wellKnownScaleSet) : null,
            this.buildBoundingBox(tms),
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

    toVNode(): VNodeElement | null {
        const tms = getTileMatrixSet(this.tileSet.projection);
        if (tms == null) return null;
        return V('Capabilities', CapabilitiesAttrs, [
            ...this.buildProvider(),
            V('Contents', [this.buildLayer(tms), ...tms.map((c) => this.buildTileMatrixSet(c))]),
        ]);
    }

    toString(): string | null {
        const vnode = this.toVNode();
        if (vnode == null) return null;
        return '<?xml version="1.0"?>\n' + vnode.toString();
    }

    static toXml(
        httpBase: string,
        provider: TileMetadataProviderRecord,
        tileSet: TileSet,
        apiKey?: string,
    ): string | null {
        return new WmtsCapabilities(httpBase, provider, tileSet, apiKey).toString();
    }
}

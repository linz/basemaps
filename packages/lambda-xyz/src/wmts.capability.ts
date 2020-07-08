import { Epsg, TileMatrixSet, WmtsLayer, WmtsProvider } from '@basemaps/geo';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Nztm2000Tms } from '@basemaps/geo/build/tms/nztm2000';
import { TileMetadataProviderRecord, V, VNodeElement } from '@basemaps/shared';
import { ImageFormatOrder } from '@basemaps/tiler';
import { TileSet } from './tile.set';

function getTileMatrixSet(projection: Epsg): TileMatrixSet {
    switch (projection) {
        case Epsg.Google:
            return GoogleTms;
        case Epsg.Nztm2000:
            return Nztm2000Tms;
        default:
            throw new Error(`Invalid projection: ${projection.code}`);
    }
}

/**
 * Get the unique list of projections needed to serve these tilesets
 * @param tileSets
 */
function getTileMatrixSets(tileSets: WmtsLayer[]): TileMatrixSet[] {
    const output = new Map<number, TileMatrixSet>();
    for (const ts of tileSets) {
        const tms = getTileMatrixSet(ts.projection);
        output.set(tms.projection.code, tms);
    }
    return Array.from(output.values());
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
    provider: WmtsProvider;

    layers: Map<string, WmtsLayer[]> = new Map();
    tms: Map<number, TileMatrixSet> = new Map();

    apiKey?: string;

    constructor(httpBase: string, provider: WmtsProvider, layers: WmtsLayer[], apiKey?: string) {
        this.httpBase = httpBase;
        this.provider = provider;

        for (const layer of layers) {
            // TODO is grouping by name the best option
            let existing = this.layers.get(layer.name);
            if (existing == null) {
                existing = [];
                this.layers.set(layer.name, existing);
            }
            // TODO should a error be thrown here if the projection is invalid
            existing.push(layer);
        }
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

    buildTileUrl(tileSet: WmtsLayer, suffix: string): string {
        const apiSuffix = this.apiKey ? `?api=${this.apiKey}` : '';
        return [
            this.httpBase,
            'v1',
            'tiles',
            tileSet.taggedName,
            tileSet.projection,
            '{TileMatrix}',
            '{TileCol}',
            `{TileRow}.${suffix}${apiSuffix}`,
        ].join('/');
    }

    buildResourceUrl(tileSet: WmtsLayer, suffix: string): VNodeElement {
        return V('ResourceURL', {
            format: 'image/' + suffix,
            resourceType: 'tile',
            template: this.buildTileUrl(tileSet, suffix),
        });
    }

    buildLayer(tileSet: WmtsLayer[], tms: TileMatrixSet[]): VNodeElement {
        const [firstTileSet] = tileSet;
        return V('Layer', [
            V('ows:Title', firstTileSet.title),
            V('ows:Abstract', firstTileSet.description),
            V('ows:Identifier', firstTileSet.taggedName + '-' + firstTileSet.projection),
            ...tms.map((c) => this.buildBoundingBox(c)),
            ...tms.map((c) => V('TileMatrixSetLink', [V('TileMatrixSet', c.def.identifier)])),
            ...ImageFormatOrder.map((fmt) => V('Format', 'image/' + fmt)),
            ...ImageFormatOrder.map((fmt) => this.buildResourceUrl(firstTileSet, fmt)),
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
    toVNode(): VNodeElement {
        const layers: VNodeElement[] = [];
        const matrixDefs: VNodeElement[] = [];

        const allTms = new Map<number, TileMatrixSet>();
        for (const tileSets of this.layers.values()) {
            const tms = getTileMatrixSets(tileSets);
            layers.push(this.buildLayer(tileSets, tms));

            for (const matrix of tms) {
                if (allTms.has(matrix.projection.code)) continue;
                matrixDefs.push(this.buildTileMatrixSet(matrix));
                allTms.set(matrix.projection.code, matrix);
            }
        }

        return V('Capabilities', CapabilitiesAttrs, [
            ...this.buildProvider(),
            V('Contents', layers.concat(matrixDefs)),
        ]);
    }

    toString(): string {
        return '<?xml version="1.0"?>\n' + this.toVNode().toString();
    }

    static toXml(httpBase: string, provider: TileMetadataProviderRecord, tileSet: TileSet[], apiKey?: string): string {
        return new WmtsCapabilities(httpBase, provider, tileSet, apiKey).toString();
    }
}

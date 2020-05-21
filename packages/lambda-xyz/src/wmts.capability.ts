import { EPSG, Projection } from '@basemaps/geo';
import { LambdaContext, V, VNodeElement, TileMetadataProviderRecord } from '@basemaps/lambda-shared';
import { ImageFormatOrder } from '@basemaps/tiler';
import { TileSet } from './tile.set';

const { lat, lon } = Projection.Wgs84Bound;

const MaxZoomLevel = 22;

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

const formats: VNodeElement[] = [];
for (const k of ImageFormatOrder) {
    formats.push(V('Format', 'image/' + k));
}

enum tileMatrixSetId {
    Google = 'GoogleMapsCompatible',
}

const LayerPreamble: Partial<Record<string, VNodeElement[]>> = {
    aerial: [
        V('ows:WGS84BoundingBox', { crs: 'urn:ogc:def:crs:OGC:2:84' }, [
            V('ows:LowerCorner', -lon + ' -' + lat),
            V('ows:UpperCorner', lon + ' ' + lat),
        ]),
        V('ows:Identifier', 'aerial'),
        V('Style', [V('ows:Identifier', 'default')]),
        ...formats,
    ],
};

export function providerInfo(provider: TileMetadataProviderRecord): VNodeElement[] {
    const { serviceIdentification, serviceProvider } = provider;
    const { contact } = serviceProvider;
    return [
        V('ows:ServiceIdentification', [
            V('ows:Title', serviceIdentification.title),
            V('ows:Abstract', serviceIdentification.description),
            V('ows:ServiceType', 'OGC WMTS'),
            V('ows:ServiceTypeVersion', '1.0.' + provider.version),
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

function wellKnownScaleSet(projection: EPSG): VNodeElement[] {
    return projection === EPSG.Google ? [V('WellKnownScaleSet', 'urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible')] : [];
}

const CommonGlobalMercator = [
    V('TopLeftCorner', -Projection.OriginShift + ' ' + Projection.OriginShift),
    V('TileWidth', '256'),
    V('TileHeight', '256'),
];

function getMatrixSets(tileSet: TileSet): VNodeElement | null {
    if (tileSet.projection === EPSG.Google) {
        const matrices = [];
        let scale = Projection.GoogleScaleDenominator,
            size = 1;
        for (let i = 0; i < MaxZoomLevel; ++i, scale *= 0.5) {
            const dim = String(size);
            size *= 2;
            matrices.push(
                V('TileMatrix', [
                    V('ows:Identifier', i),
                    V('ScaleDenominator', scale),
                    ...CommonGlobalMercator,
                    V('MatrixWidth', dim),
                    V('MatrixHeight', dim),
                ]),
            );
        }
        return V('TileMatrixSet', [
            V('ows:Identifier', tileMatrixSetId.Google),
            V('ows:SupportedCRS', Projection.toUrn(EPSG.Google)),
            ...wellKnownScaleSet(EPSG.Google),
            ...matrices,
        ]);
    }
    return null;
}

const getLayerElements = (tileSet: TileSet): [VNodeElement[], string, VNodeElement] | [] => {
    const preamble = [V('ows:Title', tileSet.title), V('ows:Abstract', tileSet.description), ...LayerPreamble.aerial!]; // TODO support other imagery types
    const sets = getMatrixSets(tileSet);
    if (sets != null) {
        return [preamble, tileMatrixSetId.Google, sets];
    }
    return [];
};

/**
 * Generate the WMTSCapabilities.xml file for a given `name` and `projection`
 **/
export function buildWmtsCapabilityToVNode(
    httpBase: string,
    req: LambdaContext,
    provider: TileMetadataProviderRecord,
    tileSet: TileSet,
): VNodeElement | null {
    const [preambleXml, matrixSetId, matrixSet] = getLayerElements(tileSet);
    if (preambleXml == null || matrixSetId == null) return null;
    const resUrls: VNodeElement[] = [];
    const apiKey = req.apiKey;
    for (const suffix of ImageFormatOrder) {
        resUrls.push(
            V('ResourceURL', {
                format: 'image/' + suffix,
                resourceType: 'tile',
                template: `${httpBase}/v1/tiles/${tileSet.taggedName}/${
                    tileSet.projection
                }/{TileMatrix}/{TileCol}/{TileRow}.${suffix}${apiKey ? '?api=' + apiKey : ''}`,
            }),
        );
    }

    return V('Capabilities', CapabilitiesAttrs, [
        ...providerInfo(provider),
        V('Contents', [
            V('Layer', [...preambleXml, V('TileMatrixSetLink', [V('TileMatrixSet', matrixSetId)]), ...resUrls]),
            matrixSet,
        ]),
    ]);
}

export function buildWmtsCapability(
    httpBase: string,
    req: LambdaContext,
    provider: TileMetadataProviderRecord,
    tileSet: TileSet,
): string | null {
    const vnode = buildWmtsCapabilityToVNode(httpBase, req, provider, tileSet);
    return vnode && '<?xml version="1.0"?>\n' + vnode.toString();
}

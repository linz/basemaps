import { EPSG, Projection } from '@basemaps/geo';
import { LambdaContext, TileDataWmts, V, VNodeElement } from '@basemaps/lambda-shared';
import { ImageFormatOrder } from '@basemaps/tiler';
import { getTileSet } from './tile.set.cache';
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

const tileMatrixSetId: Partial<Record<string, string>> = {
    aerial: 'GoogleMapsCompatible',
};

const LayerPreamble: Partial<Record<string, VNodeElement[]>> = {
    aerial: [
        V('ows:Title', 'NZ Aerial Imagery Basemap'),
        V(
            'ows:Abstract',
            `The NZ Aerial Imagery basemap provides a seamless nationwide imagery layer with the newest and
highest resolution data, and covers 95% of New Zealand.

The date of capture is prioritised over resolution. This means newer imagery layers are prioritised
above higher resolution imagery in the same location.

This basemap has been designed to be integrated into GIS, web and mobile applications via our WMTS
and XYZ tile services. View the Services tab to access these services.

This layer is made up of individual aerial imagery (orthophotography) layers available on the [LINZ
Data Service](https://data.linz.govt.nz/data/category/aerial-photos/) and will be updated as new
imagery is captured.

Please refer to the individual layers for specific accuracy, pixel resolution, and licensing
attribution requirements. More information about the individual layers can be found using the [NZ
Imagery Surveys layer.](https://data.linz.govt.nz/layer/95677-nz-imagery-surveys/)

A list of attribution requirements for each layer are also available at [Attributing Aerial Imagery
data](http://www.linz.govt.nz/data/licensing-and-using-data/attributing-aerial-imagery-data).`,
        ),
        V('ows:WGS84BoundingBox', { crs: 'urn:ogc:def:crs:OGC:2:84' }, [
            V('ows:LowerCorner', -lon + ' -' + lat),
            V('ows:UpperCorner', lon + ' ' + lat),
        ]),
        V('ows:Identifier', 'aerial'),
        V('Style', [V('ows:Identifier', 'default')]),
        ...formats,
    ],
};

const ProviderInfo = [
    V('ows:ServiceIdentification', [
        V('ows:Title', 'National Base Mapping Service (LINZ)'),
        V('ows:Abstract', 'National Mapping Service provided by Land Information New Zealand'),
        V('ows:ServiceType', 'OGC WMTS'),
        V('ows:ServiceTypeVersion', '1.0.0'),
        V('ows:Fees', `There are no fees associated with data access via the web interface, API or Web Services.`),
        V(
            'ows:AccessConstraints',
            `
LINZ Data Service Customers complete a self registration process where
they accept site terms. Access to the data is subject to the terms of
the Creative Commons 3.0
`,
        ),
    ]),

    V('ows:ServiceProvider', [
        V('ows:ProviderName', 'Land Information New Zealand'),
        V('ows:ProviderSite', { 'xlink:href': 'http://www.linz.govt.nz' }),
        V('ows:ServiceContact', [
            V('ows:IndividualName', 'LINZ Customer Support'),
            V('ows:PositionName', 'Customer Support'),
            V('ows:ContactInfo', [
                V('ows:Phone', [V('ows:Voice', '+64 4 4600110'), V('ows:Facsimile', '+64 4 4983842')]),
                V('ows:Address', [
                    V('ows:DeliveryPoint', 'Land Information New Zealand'),
                    V('ows:City', 'Wellington'),
                    V('ows:PostalCode', '6145'),
                    V('ows:Country', 'New Zealand'),
                    V('ows:ElectronicMailAddress', 'customersupport@linz.govt.nz'),
                ]),
            ]),
        ]),
    ]),
];

function wellKnownScaleSet(projection: EPSG): VNodeElement[] {
    return projection === EPSG.Google ? [V('WellKnownScaleSet', 'urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible')] : [];
}

const CommonGlobalMercator = [
    V('TopLeftCorner', -Projection.OriginShift + ' ' + Projection.OriginShift),
    V('TileWidth', '256'),
    V('TileHeight', '256'),
];

type Generator = Record<string, Record<string, (tileSet: TileSet) => VNodeElement>>;

const MatrixSets: Generator = {
    aerial: {
        [EPSG.Google]: (tileSet: TileSet): VNodeElement => {
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
                V('ows:Identifier', tileMatrixSetId[tileSet.name]!),
                V('ows:SupportedCRS', Projection.toUrn(EPSG.Google)),
                ...wellKnownScaleSet(EPSG.Google),
                ...matrices,
            ]);
        },
    },
};

const getLayerElements = (tileSet: TileSet): [VNodeElement[], string, VNodeElement] | [] => {
    const preamble = LayerPreamble.aerial; // TODO support other imagery types
    const sets = MatrixSets.aerial;
    const func = sets[tileSet.projection];
    if (preamble != null && func != null) {
        return [preamble, tileMatrixSetId.aerial!, func(tileSet)];
    }
    return [];
};

/**
 * Generate the WMTSCapabilities.xml file for a given `name` and `projection`
 **/
export function buildWmtsCapabilityToVNode(
    httpBase: string,
    req: LambdaContext,
    wmtsData: TileDataWmts,
): VNodeElement | null {
    const projection = wmtsData.projection ?? EPSG.Google;
    const tileSet = getTileSet(wmtsData.name, projection);
    if (tileSet == null) return null;
    const [preambleXml, matrixSetId, matrixSet] = getLayerElements(tileSet);
    if (preambleXml == null || matrixSetId == null) return null;
    const resUrls: VNodeElement[] = [];
    const apiKey = req.apiKey;
    for (const suffix of ImageFormatOrder) {
        resUrls.push(
            V('ResourceURL', {
                format: 'image/' + suffix,
                resourceType: 'tile',
                template: `${httpBase}/v1/tiles/${
                    wmtsData.name
                }/${projection}/{TileMatrix}/{TileCol}/{TileRow}.${suffix}${apiKey ? '?api=' + apiKey : ''}`,
            }),
        );
    }

    return V('Capabilities', CapabilitiesAttrs, [
        ...ProviderInfo,
        V('Contents', [
            V('Layer', [...preambleXml, V('TileMatrixSetLink', [V('TileMatrixSet', matrixSetId)]), ...resUrls]),
            matrixSet,
        ]),
    ]);
}

export function buildWmtsCapability(httpBase: string, req: LambdaContext, wmtsData: TileDataWmts): string | null {
    const vnode = buildWmtsCapabilityToVNode(httpBase, req, wmtsData);
    return vnode && '<?xml version="1.0"?>\n' + vnode.toString();
}

import { V, VNode, TileSetType, VNodeElement } from '@basemaps/lambda-shared';
import { EPSG, Projection } from '@basemaps/geo';
import { ImageFormat } from '@basemaps/tiler';

const { lat, lon } = Projection.Wgs84Bound;

const MaxZoomLevel = 25;

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

const formats: VNode[] = [];
for (const k in ImageFormat) formats.push(V('Format', 'image/' + ImageFormat[k as keyof typeof ImageFormat]));

const LayerPreamble: Record<TileSetType, VNode[]> = {
    [TileSetType.aerial]: [
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

type EPSGToGenerator = Map<EPSG, (tileSet: TileSetType, projection: EPSG) => VNode>;

const MatrixSets = new Map<TileSetType, EPSGToGenerator>();

{
    const AerialMap = new Map<EPSG, (tileSet: TileSetType, projection: EPSG) => VNode>();
    MatrixSets.set(TileSetType.aerial, AerialMap);

    AerialMap.set(
        EPSG.Google,
        (tileSet: TileSetType, projection: EPSG): VNode => {
            const matrices = [];
            let scale = 559082264.029,
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
                V('ows:Identifier', tileSet),
                V('ows:SupportedCRS', Projection.toUrn(projection)),
                ...wellKnownScaleSet(projection),
                ...matrices,
            ]);
        },
    );
}

const layerPreamble = (tileSet: TileSetType): VNode[] | null => LayerPreamble[tileSet];
const tileMatrixSets = (tileSet: TileSetType, projection: EPSG | null): VNode[] | null => {
    const sets = MatrixSets.get(tileSet);
    if (sets == null) return null;

    const func = projection != null ? sets.get(projection) : null;

    if (projection != null) {
        if (func != null) return [func(tileSet, projection)];
    } else {
        const ans = [];
        for (const [projection, func] of sets.entries()) {
            ans.push(func(tileSet, projection));
        }
        return ans;
    }
    return null;
};

/**
 * Generate the WMTSCapabilities.xml file for a given `tileSet` and `projection`
 **/
export function buildWmtsCapabilityToVNode(
    httpBase: string,
    apiKey: string,
    tileSet: TileSetType,
    projection: EPSG | null,
): VNode | null {
    if (projection == null) projection = EPSG.Google;
    const preambleXml = layerPreamble(tileSet);
    if (preambleXml == null) return null;
    const tileSets = tileMatrixSets(tileSet, projection);
    if (tileSets == null) return null;
    const resUrls: VNode[] = [];
    for (const k in ImageFormat) {
        const suffix = ImageFormat[k as keyof typeof ImageFormat];
        resUrls.push(
            V('ResourceURL', {
                format: 'image/' + suffix,
                resourceType: 'tile',
                template: `${httpBase}/v1/tiles/${tileSet}/${projection}/{TileMatrix}/{TileCol}/{TileRow}.${suffix}${
                    apiKey ? '?api=' + apiKey : ''
                }`,
            }),
        );
    }

    return V('Capabilities', CapabilitiesAttrs, [
        ...ProviderInfo,
        V('Contents', [
            V('Layer', [...preambleXml, V('TileMatrixSetLink', [V('TileMatrixSet', String(tileSet))]), ...resUrls]),
            ...tileSets,
        ]),
    ]);
}

export function buildWmtsCapability(
    httpBase: string,
    apiKey: string,
    tileSet: TileSetType,
    projection: EPSG | null,
): string | null {
    const vnode = buildWmtsCapabilityToVNode(httpBase, apiKey, tileSet, projection);
    return vnode && '<?xml version="1.0"?>\n' + vnode.toString();
}

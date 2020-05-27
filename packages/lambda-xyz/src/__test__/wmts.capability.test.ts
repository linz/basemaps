import { Epsg } from '@basemaps/geo';
import { V, VNodeElement } from '@basemaps/lambda-shared';
import { createHash } from 'crypto';
import * as o from 'ospec';
import { WmtsCapabilities } from '../wmts.capability';
import { Provider, FakeTileSet } from './xyz.helper';

function tags(node: VNodeElement | null | undefined, tag: string): VNodeElement[] {
    if (node == null) return [];
    return [...node.tags(tag)];
}
function listTag(node: VNodeElement | null | undefined, tag: string): string[] {
    return tags(node, tag).map((n) => n.toString());
}

o.spec('WmtsCapabilities', () => {
    const apiKey = 'secret1234';
    const tileSet = new FakeTileSet('aerial', Epsg.Google);
    const tileSetImagery = new FakeTileSet('01E7PJFR9AMQFJ05X9G7FQ3XMW', Epsg.Google);
    // FIXME nztm2000 tests
    // const tileSetNztm2000 = new FakeTileSet('aerial', Epsg.Nztm2000);

    o('should build capability xml for tileset and projection', () => {
        const wmts = new WmtsCapabilities('https://basemaps.test', Provider, tileSet, apiKey);

        const raw = wmts.toVNode();

        const serviceId = raw?.find('ows:ServiceIdentification');

        o(serviceId?.find('ows:Abstract')?.textContent).equals('the description');
        o(serviceId?.find('ows:Title')?.textContent).equals('the title');

        o(raw?.find('TileMatrixSetLink')?.toString()).deepEquals(
            V('TileMatrixSetLink', [V('TileMatrixSet', 'WebMercatorQuad')]).toString(),
        );

        const layer = raw?.find('Contents', 'Layer');

        o(listTag(layer, 'Format')).deepEquals([
            V('Format', 'image/png').toString(),
            V('Format', 'image/webp').toString(),
            V('Format', 'image/jpeg').toString(),
        ]);

        // FIXME I dont think this this really needed? we will need to reproject to get these values
        // o(listTag(layer, 'ows:WGS84BoundingBox')).deepEquals([
        //     '<ows:WGS84BoundingBox crs="urn:ogc:def:crs:OGC:2:84">\n' +
        //         '  <ows:LowerCorner>-180 -85.0511287798066</ows:LowerCorner>\n' +
        //         '  <ows:UpperCorner>180 85.0511287798066</ows:UpperCorner>\n' +
        //         '</ows:WGS84BoundingBox>',
        // ]);

        o(listTag(layer, 'ows:BoundingBox')).deepEquals([
            V('ows:BoundingBox', { crs: Epsg.Google.toUrn() }, [
                V('ows:LowerCorner', '-20037508.3427892 -20037508.3427892'),
                V('ows:UpperCorner', '20037508.3427892 20037508.3427892'),
            ]).toString(),
        ]);

        o(layer?.find('ows:Abstract')?.textContent).equals('The Description');
        o(layer?.find('ows:Title')?.textContent).equals('The Title');

        const urls = tags(layer, 'ResourceURL');
        o(urls.length).equals(3);
        o(urls[0].toString()).deepEquals(
            '<ResourceURL format="image/png" resourceType="tile" ' +
                'template="https://basemaps.test/v1/tiles/aerial/3857/{TileMatrix}/{TileCol}/{TileRow}.png?api=secret1234" />',
        );

        o(layer?.find('TileMatrixSetLink', 'TileMatrixSet')?.textContent).equals('WebMercatorQuad');

        const matrix = tags(raw, 'TileMatrixSet')[1];
        const matrixId = raw?.find('Contents', 'TileMatrixSet', 'ows:Identifier') ?? null;
        o(matrix.find('ows:Identifier')).equals(matrixId);
        o(matrixId?.textContent).equals('WebMercatorQuad');

        o(matrix.find('ows:SupportedCRS')?.textContent).deepEquals('urn:ogc:def:crs:EPSG::3857');
        o(matrix.find('ows:WellKnownScaleSet')?.textContent).deepEquals(
            'https://www.opengis.net/def/wkss/OGC/1.0/GoogleMapsCompatible',
        );

        const tileMatrices = Array.from(matrix.tags('TileMatrix'));

        o(tileMatrices.length).equals(25);

        function compareMatrix(x: VNodeElement, id: string, tileCount: number, scale: number): void {
            o(x.find('ows:Identifier')?.toString()).equals(`<ows:Identifier>${id}</ows:Identifier>`);
            o(x.find('ScaleDenominator')?.toString()).equals(`<ScaleDenominator>${scale}</ScaleDenominator>`);
            o(x.find('TopLeftCorner')?.toString()).equals(
                `<TopLeftCorner>-20037508.3427892 20037508.3427892</TopLeftCorner>`,
            );
            o(x.find('TileWidth')?.toString()).equals(`<TileWidth>256</TileWidth>`);
            o(x.find('TileHeight')?.toString()).equals(`<TileHeight>256</TileHeight>`);
            o(x.find('MatrixWidth')?.toString()).equals(`<MatrixWidth>${tileCount}</MatrixWidth>`);
            o(x.find('MatrixHeight')?.toString()).equals(`<MatrixHeight>${tileCount}</MatrixHeight>`);
        }

        compareMatrix(tileMatrices[0], '0', 1, 559082264.028717);
        compareMatrix(tileMatrices[10], '10', 1024, 545978.773465544);

        const xml = WmtsCapabilities.toXml('https://basemaps.test', Provider, tileSet, apiKey) ?? '';

        o(xml).deepEquals('<?xml version="1.0"?>\n' + raw?.toString());

        o(createHash('sha256').update(Buffer.from(xml)).digest('base64')).equals(
            'PnCm0A31rH7Nm3jEvn7ApdNl0CWR54UCqi2tAaSGUg0=',
        );
    });

    o('should return null if not found', () => {
        const ts = new FakeTileSet('aerial', { code: 9999 } as Epsg);
        o(WmtsCapabilities.toXml('basemaps.test', Provider, ts)).equals(null);
    });

    o('should allow individual imagery sets', () => {
        const raw = new WmtsCapabilities('https://basemaps.test', Provider, tileSetImagery).toVNode();

        const tms = raw?.find('TileMatrixSet', 'ows:Identifier');

        o(tms?.textContent).equals('WebMercatorQuad');

        const urls = Array.from(raw ? raw.tags('ResourceURL') : []);
        o(urls.length).equals(3);
        o(urls[0].toString()).deepEquals(
            '<ResourceURL format="image/png" resourceType="tile" ' +
                'template="https://basemaps.test/v1/tiles/01E7PJFR9AMQFJ05X9G7FQ3XMW/3857/{TileMatrix}/{TileCol}/{TileRow}.png" />',
        );
    });
});

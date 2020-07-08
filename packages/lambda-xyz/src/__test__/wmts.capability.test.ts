import { Epsg } from '@basemaps/geo';
import { V, VNodeElement } from '@basemaps/shared';
import { createHash } from 'crypto';
import o from 'ospec';
import { WmtsCapabilities } from '../wmts.capability';
import { Provider, FakeTileSet } from './xyz.util';

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

    o('should build capability xml for tileset and projection', () => {
        const wmts = new WmtsCapabilities('https://basemaps.test', Provider, [tileSet], apiKey);

        const raw = wmts.toVNode();
        const serviceId = raw.find('ows:ServiceIdentification');

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

        o(layer?.find('ows:Abstract')?.textContent).equals('aerial:description');
        o(layer?.find('ows:Title')?.textContent).equals('aerial:title');
        o(layer?.find('ows:Identifier')?.textContent).equals('aerial-3857');

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

        const xml = WmtsCapabilities.toXml('https://basemaps.test', Provider, [tileSet], apiKey) ?? '';

        o(xml).deepEquals('<?xml version="1.0"?>\n' + raw?.toString());

        o(createHash('sha256').update(Buffer.from(xml)).digest('base64')).equals(
            'YI1PxiLF9ZjfaIaIkqiYfwvQFV3FmEJVRys0UuNyyzE=',
        );
    });

    o('should return null if not found', () => {
        const ts = new FakeTileSet('aerial', { code: 9999 } as Epsg);
        o(() => WmtsCapabilities.toXml('basemaps.test', Provider, [ts])).throws('Invalid projection: 9999');
    });

    o('should allow individual imagery sets', () => {
        const raw = new WmtsCapabilities('https://basemaps.test', Provider, [tileSetImagery]).toVNode();

        const tms = raw?.find('TileMatrixSet', 'ows:Identifier');

        o(tms?.textContent).equals('WebMercatorQuad');

        const urls = Array.from(raw ? raw.tags('ResourceURL') : []);
        o(urls.length).equals(3);
        o(urls[0].toString()).deepEquals(
            '<ResourceURL format="image/png" resourceType="tile" ' +
                'template="https://basemaps.test/v1/tiles/01E7PJFR9AMQFJ05X9G7FQ3XMW/3857/{TileMatrix}/{TileCol}/{TileRow}.png" />',
        );
    });

    o('should support multiple projections', () => {
        const ts = [new FakeTileSet('aerial', Epsg.Nztm2000), new FakeTileSet('aerial', Epsg.Google)];
        const xml = new WmtsCapabilities('basemaps.test', Provider, ts);
        const nodes = xml.toVNode();

        const layers = tags(nodes, 'Layer');
        o(layers.length).equals(1);
        const layer = layers[0];
        const sets = tags(layer, 'TileMatrixSet');

        o(sets.length).equals(2);
        o(sets[0].toString()).equals('<TileMatrixSet>NZTM2000</TileMatrixSet>');
        o(sets[1].toString()).equals('<TileMatrixSet>WebMercatorQuad</TileMatrixSet>');

        const tms = tags(nodes, 'TileMatrixSet').filter((f) => f.find('ows:SupportedCRS') != null);
        o(tms.length).equals(2);

        o(tms[0].find('ows:Identifier')?.textContent).equals('NZTM2000');
        o(tms[0].find('ows:SupportedCRS')?.textContent).equals('urn:ogc:def:crs:EPSG::2193');

        o(tms[1].find('ows:Identifier')?.textContent).equals('WebMercatorQuad');
        o(tms[1].find('ows:SupportedCRS')?.textContent).equals('urn:ogc:def:crs:EPSG::3857');
    });

    o('should support multiple tilesets', () => {
        const ts = [
            new FakeTileSet('aerial', Epsg.Nztm2000, 'aerial-title'),
            new FakeTileSet('01E7PJFR9AMQFJ05X9G7FQ3XMW', Epsg.Nztm2000, 'imagery-title'),
        ];
        const nodes = new WmtsCapabilities('basemaps.test', Provider, ts).toVNode();
        const layers = tags(nodes, 'Layer');
        o(layers.length).equals(2);

        o(layers[0].find('ows:Title')?.textContent).equals('aerial-title');
        o(layers[0].find('TileMatrixSet')?.textContent).equals('NZTM2000');

        o(layers[1].find('ows:Title')?.textContent).equals('imagery-title');
        o(layers[1].find('TileMatrixSet')?.textContent).equals('NZTM2000');
    });

    o('should support multiple different projections on differnt tiles sets', () => {
        const ts = [
            new FakeTileSet('aerial', Epsg.Nztm2000, 'aerial'),
            new FakeTileSet('01E7PJFR9AMQFJ05X9G7FQ3XMW', Epsg.Google, '01E7PJFR9AMQFJ05X9G7FQ3XMW'),
        ];
        const nodes = new WmtsCapabilities('basemaps.test', Provider, ts).toVNode();
        const layers = tags(nodes, 'Layer');
        o(layers.length).equals(2);

        o(layers[0].find('ows:Title')?.textContent).equals('aerial');
        o(layers[0].find('TileMatrixSet')?.textContent).equals('NZTM2000');

        o(layers[1].find('ows:Title')?.textContent).equals('01E7PJFR9AMQFJ05X9G7FQ3XMW');
        o(layers[1].find('TileMatrixSet')?.textContent).equals('WebMercatorQuad');
    });
});

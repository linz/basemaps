import { Bounds, Epsg, TileMatrixSet } from '@basemaps/geo';
import { GoogleTms } from '@basemaps/geo/build/tms/google';
import { Nztm2000Tms } from '@basemaps/geo/build/tms/nztm2000';
import { TileSetName, V, VNodeElement } from '@basemaps/shared';
import { roundNumbersInString } from '@basemaps/test/build/rounding';
import { createHash } from 'crypto';
import o from 'ospec';
import { WmtsCapabilities } from '../wmts.capability';
import { FakeTileSet, Provider } from './xyz.util';

function tags(node: VNodeElement | null | undefined, tag: string): VNodeElement[] {
    if (node == null) return [];
    return [...node.tags(tag)];
}
function listTag(node: VNodeElement | null | undefined, tag: string): string[] {
    return tags(node, tag).map((n) => n.toString());
}

o.spec('WmtsCapabilities', () => {
    const apiKey = 'secret1234';
    const tileSet = new FakeTileSet(TileSetName.aerial, Epsg.Google);
    const tileSetImagery = new FakeTileSet('01E7PJFR9AMQFJ05X9G7FQ3XMW', Epsg.Google);

    const tileMatrixSetMap = new Map<Epsg, TileMatrixSet>([
        [Epsg.Google, GoogleTms],
        [Epsg.Nztm2000, Nztm2000Tms],
    ]);

    o('should build capability xml for tileset and projection', () => {
        const wmts = new WmtsCapabilities('https://basemaps.test', Provider, [tileSet], tileMatrixSetMap, apiKey);

        const raw = wmts.toVNode();
        const serviceId = raw.find('ows:ServiceIdentification');

        o(serviceId?.find('ows:Abstract')?.textContent).equals('the description');
        o(serviceId?.find('ows:Title')?.textContent).equals('the title');

        o(raw?.find('TileMatrixSetLink')?.toString()).deepEquals(
            V('TileMatrixSetLink', [V('TileMatrixSet', 'EPSG:3857')]).toString(),
        );

        const layer = raw?.find('Contents', 'Layer');

        o(listTag(layer, 'Format')).deepEquals([
            V('Format', 'image/jpeg').toString(),
            V('Format', 'image/webp').toString(),
            V('Format', 'image/png').toString(),
        ]);

        o(listTag(layer, 'ows:BoundingBox')).deepEquals([
            V('ows:BoundingBox', { crs: Epsg.Google.toUrn() }, [
                V('ows:LowerCorner', '-20037508.3427892 -20037508.3427892'),
                V('ows:UpperCorner', '20037508.3427892 20037508.3427892'),
            ]).toString(),
        ]);

        o(listTag(layer, 'ows:WGS84BoundingBox').map((s) => roundNumbersInString(s, 4))).deepEquals([
            '<ows:WGS84BoundingBox crs="urn:ogc:def:crs:OGC:2:84">\n' +
                '  <ows:LowerCorner>-180 -85.0511</ows:LowerCorner>\n' +
                '  <ows:UpperCorner>180 85.0511</ows:UpperCorner>\n' +
                '</ows:WGS84BoundingBox>',
        ]);

        o(layer?.find('ows:Abstract')?.textContent).equals('aerial:description');
        o(layer?.find('ows:Title')?.textContent).equals('aerial:title');
        o(layer?.find('ows:Identifier')?.textContent).equals('aerial');

        o(layer?.find('Style')?.toString()).equals(
            V('Style', { isDefault: 'true' }, [
                V('ows:Title', 'Default Style'),
                V('ows:Identifier', 'default'),
            ]).toString(),
        );

        const urls = tags(layer, 'ResourceURL');
        o(urls.length).equals(3);
        o(urls[2].toString()).deepEquals(
            '<ResourceURL format="image/png" resourceType="tile" ' +
                'template="https://basemaps.test/v1/tiles/aerial/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png?api=secret1234" />',
        );

        o(layer?.find('TileMatrixSetLink', 'TileMatrixSet')?.textContent).equals('EPSG:3857');

        const matrix = tags(raw, 'TileMatrixSet')[1];
        const matrixId = raw?.find('Contents', 'TileMatrixSet', 'ows:Identifier') ?? null;
        o(matrix.find('ows:Identifier')).equals(matrixId);
        o(matrixId?.textContent).equals('EPSG:3857');

        o(matrix.find('ows:SupportedCRS')?.textContent).deepEquals('urn:ogc:def:crs:EPSG::3857');
        o(matrix.find('WellKnownScaleSet')?.textContent).deepEquals(
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

        const xml =
            WmtsCapabilities.toXml('https://basemaps.test', Provider, [tileSet], tileMatrixSetMap, apiKey) ?? '';

        o(xml).deepEquals('<?xml version="1.0"?>\n' + raw?.toString());

        o(createHash('sha256').update(Buffer.from(xml)).digest('base64')).equals(
            'T/Ht5RdGQyxQxkVgyZO0hb018OmuUUP7olFMZXvmGUY=',
        );
    });

    o('should return null if not found', () => {
        const ts = new FakeTileSet(TileSetName.aerial, { code: 9999 } as Epsg);
        o(() => WmtsCapabilities.toXml('basemaps.test', Provider, [ts], tileMatrixSetMap)).throws(
            'Invalid projection: 9999',
        );
    });

    o('should allow individual imagery sets', () => {
        const raw = new WmtsCapabilities(
            'https://basemaps.test',
            Provider,
            [tileSetImagery],
            tileMatrixSetMap,
        ).toVNode();

        const tms = raw?.find('TileMatrixSet', 'ows:Identifier');

        o(tms?.textContent).equals('EPSG:3857');

        const urls = Array.from(raw ? raw.tags('ResourceURL') : []);
        o(urls.length).equals(3);
        o(urls[2].toString()).deepEquals(
            '<ResourceURL format="image/png" resourceType="tile" ' +
                'template="https://basemaps.test/v1/tiles/01E7PJFR9AMQFJ05X9G7FQ3XMW/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png" />',
        );
    });

    o('should support multiple projections', () => {
        const ts = [
            new FakeTileSet(TileSetName.aerial, Epsg.Nztm2000),
            new FakeTileSet(TileSetName.aerial, Epsg.Google),
        ];
        const xml = new WmtsCapabilities('basemaps.test', Provider, ts, tileMatrixSetMap);
        const nodes = xml.toVNode();

        const layers = tags(nodes, 'Layer');
        o(layers.length).equals(1);
        const layer = layers[0];

        // ensure order is valid
        o(layer?.children.map((c) => (c instanceof VNodeElement ? c.tag : null))).deepEquals([
            'ows:Title',
            'ows:Abstract',
            'ows:Identifier',
            'ows:BoundingBox',
            'ows:BoundingBox',
            'ows:WGS84BoundingBox',
            'Style',
            'Format',
            'Format',
            'Format',
            'TileMatrixSetLink',
            'TileMatrixSetLink',
            'ResourceURL',
            'ResourceURL',
            'ResourceURL',
        ]);

        const sets = tags(layer, 'TileMatrixSet');

        o(sets.length).equals(2);
        o(sets[0].toString()).equals('<TileMatrixSet>EPSG:2193</TileMatrixSet>');
        o(sets[1].toString()).equals('<TileMatrixSet>EPSG:3857</TileMatrixSet>');

        const tms = tags(nodes, 'TileMatrixSet').filter((f) => f.find('ows:SupportedCRS') != null);
        o(tms.length).equals(2);

        o(tms[0].find('ows:Identifier')?.textContent).equals('EPSG:2193');
        o(tms[0].find('ows:SupportedCRS')?.textContent).equals('urn:ogc:def:crs:EPSG::2193');

        o(tms[1].find('ows:Identifier')?.textContent).equals('EPSG:3857');
        o(tms[1].find('ows:SupportedCRS')?.textContent).equals('urn:ogc:def:crs:EPSG::3857');
    });

    o('should support multiple tilesets', () => {
        const ts = [
            new FakeTileSet(TileSetName.aerial, Epsg.Nztm2000, 'aerial-title'),
            new FakeTileSet('01E7PJFR9AMQFJ05X9G7FQ3XMW', Epsg.Nztm2000, 'imagery-title'),
        ];
        const nodes = new WmtsCapabilities('basemaps.test', Provider, ts, tileMatrixSetMap).toVNode();
        const layers = tags(nodes, 'Layer');
        o(layers.length).equals(2);

        o(layers[0].find('ows:Title')?.textContent).equals('aerial-title');
        o(layers[0].find('TileMatrixSet')?.textContent).equals('EPSG:2193');

        o(layers[1].find('ows:Title')?.textContent).equals('imagery-title');
        o(layers[1].find('TileMatrixSet')?.textContent).equals('EPSG:2193');
    });

    o('should support multiple different projections on differnt tiles sets', () => {
        const ts = [
            new FakeTileSet(TileSetName.aerial, Epsg.Nztm2000, TileSetName.aerial),
            new FakeTileSet('01F75X9G7FQ3XMWPJFR9AMQFJ0', Epsg.Nztm2000, '01F75X9G7FQ3XMWPJFR9AMQFJ0'),
            new FakeTileSet('01E7PJFR9AMQFJ05X9G7FQ3XMW', Epsg.Google, '01E7PJFR9AMQFJ05X9G7FQ3XMW'),
        ];
        ts[1].extentOverride = new Bounds(1, 2, 2, 2);
        ts[1].titleOverride = 'override sub tileset 1';

        ts[2].tileSet.title = 'aerial_dunedin_urban';
        const nodes = new WmtsCapabilities('basemaps.test', Provider, ts, tileMatrixSetMap).toVNode();

        const allMatrixes = tags(nodes, 'TileMatrixSet');

        o(allMatrixes[0].children[0].textContent).equals('EPSG:2193');
        o(allMatrixes[1].children[0].textContent).equals('EPSG:2193');
        o(allMatrixes[2].children[0].textContent).equals('EPSG:3857');

        o(allMatrixes[3].find('ows:Identifier')?.textContent).equals('EPSG:2193');
        o(allMatrixes[4].find('ows:Identifier')?.textContent).equals('EPSG:3857');
        o(allMatrixes.length).equals(5);

        const layers = tags(nodes, 'Layer');
        o(layers.length).equals(3);

        o(layers[0].find('ows:Title')?.textContent).equals(TileSetName.aerial);
        o(layers[0].find('TileMatrixSet')?.textContent).equals('EPSG:2193');

        o(layers[1].find('ows:Title')?.textContent).equals('override sub tileset 1');
        o(layers[1].find('ows:Identifier')?.textContent).equals('01F75X9G7FQ3XMWPJFR9AMQFJ0');
        o(layers[1].find('TileMatrixSet')?.textContent).equals('EPSG:2193');
        o(layers[1].find('ows:BoundingBox')?.toString()).equals(
            '<ows:BoundingBox crs="urn:ogc:def:crs:EPSG::2193">\n' +
                '  <ows:LowerCorner>2 1</ows:LowerCorner>\n' +
                '  <ows:UpperCorner>4 3</ows:UpperCorner>\n' +
                '</ows:BoundingBox>',
        );

        o(layers[2].find('ows:Title')?.textContent).equals('aerial_dunedin_urban');
        o(layers[2].find('ows:Identifier')?.textContent).equals('01E7PJFR9AMQFJ05X9G7FQ3XMW');
        o(layers[2].find('TileMatrixSet')?.textContent).equals('EPSG:3857');
        o(layers[2].find('ows:BoundingBox')?.toString()).equals(
            '<ows:BoundingBox crs="urn:ogc:def:crs:EPSG::3857">\n' +
                '  <ows:LowerCorner>-20037508.3427892 -20037508.3427892</ows:LowerCorner>\n' +
                '  <ows:UpperCorner>20037508.3427892 20037508.3427892</ows:UpperCorner>\n' +
                '</ows:BoundingBox>',
        );
    });
});

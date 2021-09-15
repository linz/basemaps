import { Bounds, Epsg, GoogleTms, Nztm2000QuadTms, Nztm2000Tms } from '@basemaps/geo';
import { TileSetName, V, VNodeElement } from '@basemaps/shared';
import { roundNumbersInString } from '@basemaps/test/build/rounding';
import { createHash } from 'crypto';
import o from 'ospec';
import { WmtsCapabilities } from '../wmts.capability.js';
import { FakeTileSet, Provider } from './xyz.util.js';

import 'source-map-support/register';

function tags(node: VNodeElement | null | undefined, tag: string): VNodeElement[] {
    if (node == null) return [];
    return [...node.tags(tag)];
}
function listTag(node: VNodeElement | null | undefined, tag: string): string[] {
    return tags(node, tag).map((n) => n.toString());
}

o.spec('WmtsCapabilities', () => {
    const apiKey = 'secret1234';
    const tileSet = new FakeTileSet(TileSetName.aerial, GoogleTms);
    const tileSetImagery = new FakeTileSet('01E7PJFR9AMQFJ05X9G7FQ3XMW', GoogleTms);

    o('should build capability xml for tileset and projection', () => {
        const wmts = new WmtsCapabilities('https://basemaps.test', Provider, [tileSet], apiKey);

        const raw = wmts.toVNode();
        const serviceId = raw.find('ows:ServiceIdentification');

        o(serviceId?.find('ows:Abstract')?.textContent).equals('the description');
        o(serviceId?.find('ows:Title')?.textContent).equals('the title');

        o(raw.find('TileMatrixSetLink')?.toString()).deepEquals(
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

        const xml = WmtsCapabilities.toXml('https://basemaps.test', Provider, [tileSet], apiKey) ?? '';

        o(xml).deepEquals('<?xml version="1.0"?>\n' + raw?.toString());

        o(createHash('sha256').update(Buffer.from(xml)).digest('base64')).equals(
            'beknYyMt8v74vK4p84AS3c1OnBSJ+ZE0kan+mMVQS1A=',
        );
    });

    o('should allow individual imagery sets', () => {
        const raw = new WmtsCapabilities('https://basemaps.test', Provider, [tileSetImagery]).toVNode();

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
        const ts = [new FakeTileSet(TileSetName.aerial, Nztm2000Tms), new FakeTileSet(TileSetName.aerial, GoogleTms)];
        const xml = new WmtsCapabilities('basemaps.test', Provider, ts);
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
            new FakeTileSet(TileSetName.aerial, Nztm2000Tms, 'aerial-title'),
            new FakeTileSet('01E7PJFR9AMQFJ05X9G7FQ3XMW', Nztm2000Tms, 'imagery-title'),
        ];
        const nodes = new WmtsCapabilities('basemaps.test', Provider, ts).toVNode();
        const layers = tags(nodes, 'Layer');
        o(layers.length).equals(2);

        o(layers[0].find('ows:Title')?.textContent).equals('aerial-title');
        o(layers[0].find('TileMatrixSet')?.textContent).equals('EPSG:2193');

        o(layers[1].find('ows:Title')?.textContent).equals('imagery-title');
        o(layers[1].find('TileMatrixSet')?.textContent).equals('EPSG:2193');
    });

    o('should support child tile sets', () => {
        const ts = [
            new FakeTileSet(
                `${TileSetName.aerial}:wairoa_urban_2014-2015_0-10m_RGBA`,
                Nztm2000Tms,
                'wairoa_urban_2014-2015_0-10m_RGBA',
            ),
            new FakeTileSet(
                `${TileSetName.aerial}:west-coast_rural_2016-17_0-3m`,
                Nztm2000Tms,
                'west-coast_rural_2016-17_0-3m',
            ),
        ];
        const nodes = new WmtsCapabilities('basemaps.test', Provider, ts).toVNode();
        const layers = tags(nodes, 'Layer');

        o(layers.length).equals(2);

        const boundingBoxes = tags(layers[0], 'ows:BoundingBox');
        o(boundingBoxes.length).equals(1);

        const firstTitle = layers[0].children[0].textContent;
        o(firstTitle).equals('wairoa_urban_2014-2015_0-10m_RGBA');
        const secondTitle = layers[1].children[0].textContent;
        o(secondTitle).equals('west-coast_rural_2016-17_0-3m');
    });

    o('should support multiple different projections on different tiles sets', () => {
        const ts = [
            new FakeTileSet(TileSetName.aerial, Nztm2000Tms, TileSetName.aerial),
            new FakeTileSet('01F75X9G7FQ3XMWPJFR9AMQFJ0', Nztm2000Tms, '01F75X9G7FQ3XMWPJFR9AMQFJ0'),
            new FakeTileSet('01E7PJFR9AMQFJ05X9G7FQ3XMW', GoogleTms, '01E7PJFR9AMQFJ05X9G7FQ3XMW'),
            new FakeTileSet('01E7PJFR9AMQFJ05X9G7FQ3XMW', Nztm2000QuadTms, '01E7PJFR9AMQFJ05X9G7FQ3XMW'),
        ];
        ts[1].extentOverride = new Bounds(1, 2, 2, 2);

        ts[2].tileSet.title = 'aerial_dunedin_urban';
        const nodes = new WmtsCapabilities('basemaps.test', Provider, ts).toVNode();

        const allMatrixes = tags(nodes, 'TileMatrixSet');

        o(allMatrixes[0].children[0].textContent).equals('EPSG:2193');
        o(allMatrixes[1].children[0].textContent).equals('EPSG:2193');
        o(allMatrixes[2].children[0].textContent).equals('EPSG:3857');
        o(allMatrixes[3].children[0].textContent).equals('NZTM2000Quad');

        o(allMatrixes[4].find('ows:Identifier')?.textContent).equals('EPSG:2193');
        o(allMatrixes[5].find('ows:Identifier')?.textContent).equals('EPSG:3857');
        o(allMatrixes[6].find('ows:Identifier')?.textContent).equals('NZTM2000Quad');
        o(allMatrixes.length).equals(7);

        const layers = tags(nodes, 'Layer');
        o(layers.length).equals(3);

        o(layers[0].find('ows:Title')?.textContent).equals(TileSetName.aerial);
        o(layers[0].find('TileMatrixSet')?.textContent).equals('EPSG:2193');

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

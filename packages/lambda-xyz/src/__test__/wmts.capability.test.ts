import { EPSG } from '@basemaps/geo';
import { TileSetType, VNode } from '@basemaps/lambda-shared';
import * as o from 'ospec';
import { buildWmtsCapability, buildWmtsCapabilityToVNode } from '../wmts.capability';
import { createHash } from 'crypto';

const listTag = (node: VNode, tag: string): string[] => Array.from(node.tags(tag)).map((n) => n.toString());

o.spec('wmts', () => {
    o('should build capabiltiy xml for tileset and projection', () => {
        const raw = buildWmtsCapabilityToVNode('https://basemaps.test', 'secret1234', TileSetType.aerial, EPSG.Google);

        if (raw == null) {
            o(raw).notEquals(null);
            return;
        }

        o(listTag(raw, 'TileMatrixSetLink')).deepEquals([
            '<TileMatrixSetLink>\n' + '  <TileMatrixSet>aerial</TileMatrixSet>\n' + '</TileMatrixSetLink>',
        ]);

        o(listTag(raw, 'Format')).deepEquals([
            '<Format>image/png</Format>',
            '<Format>image/jpeg</Format>',
            '<Format>image/webp</Format>',
        ]);

        o(listTag(raw, 'ows:WGS84BoundingBox')).deepEquals([
            '<ows:WGS84BoundingBox>\n' +
                '  <ows:LowerCorner>-180 -85.0511287798066</ows:LowerCorner>\n' +
                '  <ows:UpperCorner>180 85.0511287798066</ows:UpperCorner>\n' +
                '</ows:WGS84BoundingBox>',
        ]);

        const urls = Array.from(raw.tags('ResourceURL'));
        o(urls.length).equals(3);
        o(urls[0].toString()).deepEquals(
            '<ResourceURL format="image/png" resourceType="tile" ' +
                'template="https://basemaps.test/v1/tiles/aerial/3857/{TileMatrix}/{TileCol}/{TileRow}.png?api=secret1234">' +
                '</ResourceURL>',
        );

        const tileMatrixSet = Array.from(raw.tags('TileMatrixSet'));
        o(tileMatrixSet.length).equals(2);

        o(listTag(tileMatrixSet[1], 'ows:Identifier')[0]).equals('<ows:Identifier>aerial</ows:Identifier>');
        o(listTag(tileMatrixSet[1], 'ows:SupportedCRS')).deepEquals(['<ows:SupportedCRS>EPSG:3857</ows:SupportedCRS>']);

        const tileMatrices = Array.from(raw.tags('TileMatrix'));

        o(tileMatrices.length).equals(20);

        o(tileMatrices[0].toString()).equals(
            '<TileMatrix>\n' +
                '  <ows:Identifier>0</ows:Identifier>\n' +
                '  <ScaleDenominator>559082264.029</ScaleDenominator>\n' +
                '  <TopLeftCorner>-20037508.342789244 20037508.342789244</TopLeftCorner>\n' +
                '  <TileWidth>256</TileWidth>\n' +
                '  <TileHeight>256</TileHeight>\n' +
                '  <MatrixWidth>1</MatrixWidth>\n' +
                '  <MatrixHeight>1</MatrixHeight>\n' +
                '</TileMatrix>',
        );

        o(tileMatrices[10].toString()).equals(
            '<TileMatrix>\n' +
                '  <ows:Identifier>10</ows:Identifier>\n' +
                '  <ScaleDenominator>545978.7734658204</ScaleDenominator>\n' +
                '  <TopLeftCorner>-20037508.342789244 20037508.342789244</TopLeftCorner>\n' +
                '  <TileWidth>256</TileWidth>\n' +
                '  <TileHeight>256</TileHeight>\n' +
                '  <MatrixWidth>1024</MatrixWidth>\n' +
                '  <MatrixHeight>1024</MatrixHeight>\n' +
                '</TileMatrix>',
        );
    });

    o('should return null if not found', () => {
        o(buildWmtsCapability('basemaps.test', 's123', TileSetType.aerial, EPSG.Wgs84)).equals(null);
    });

    o('should build capabiltiy xml for tileset and all projections', () => {
        const raw = buildWmtsCapabilityToVNode('https://basemaps.test', '1a2p3i', TileSetType.aerial, null);

        if (raw == null) {
            o(raw).notEquals(null);
            return;
        }

        o(listTag(raw, 'ResourceURL')[0]).deepEquals(
            '<ResourceURL format="image/png" resourceType="tile" ' +
                'template="https://basemaps.test/v1/tiles/aerial/3857/{TileMatrix}/{TileCol}/{TileRow}.png?api=1a2p3i">' +
                '</ResourceURL>',
        );

        o(listTag(raw, 'TileMatrixSetLink')).deepEquals([
            '<TileMatrixSetLink>\n' + '  <TileMatrixSet>aerial</TileMatrixSet>\n' + '</TileMatrixSetLink>',
        ]);

        const tileMatrices = Array.from(raw.tags('TileMatrix'));

        o(tileMatrices.length).equals(20);

        o(tileMatrices[0].toString()).equals(
            '<TileMatrix>\n' +
                '  <ows:Identifier>0</ows:Identifier>\n' +
                '  <ScaleDenominator>559082264.029</ScaleDenominator>\n' +
                '  <TopLeftCorner>-20037508.342789244 20037508.342789244</TopLeftCorner>\n' +
                '  <TileWidth>256</TileWidth>\n' +
                '  <TileHeight>256</TileHeight>\n' +
                '  <MatrixWidth>1</MatrixWidth>\n' +
                '  <MatrixHeight>1</MatrixHeight>\n' +
                '</TileMatrix>',
        );

        o(tileMatrices[19].toString()).equals(
            '<TileMatrix>\n' +
                '  <ows:Identifier>19</ows:Identifier>\n' +
                '  <ScaleDenominator>1066.3647919254304</ScaleDenominator>\n' +
                '  <TopLeftCorner>-20037508.342789244 20037508.342789244</TopLeftCorner>\n' +
                '  <TileWidth>256</TileWidth>\n' +
                '  <TileHeight>256</TileHeight>\n' +
                '  <MatrixWidth>524288</MatrixWidth>\n' +
                '  <MatrixHeight>524288</MatrixHeight>\n' +
                '</TileMatrix>',
        );

        const xml = buildWmtsCapability('https://basemaps.test', '1a2p3i', TileSetType.aerial, null) || '';

        o(xml).equals('<?xml version="1.0"?>\n' + raw.toString());

        o(createHash('sha256').update(Buffer.from(xml)).digest('base64')).equals(
            'sdDWwHqM7SzcV9dL1dQ0Kp8QqulUSdk/n1vQ/a3UgN4=',
        );
    });

    o('should allow empty api key', () => {
        const raw = buildWmtsCapabilityToVNode('https://basemaps.test', '', TileSetType.aerial, EPSG.Google);

        const urls = Array.from(raw ? raw.tags('ResourceURL') : []);
        o(urls.length).equals(3);
        o(urls[0].toString()).deepEquals(
            '<ResourceURL format="image/png" resourceType="tile" ' +
                'template="https://basemaps.test/v1/tiles/aerial/3857/{TileMatrix}/{TileCol}/{TileRow}.png">' +
                '</ResourceURL>',
        );
    });
});

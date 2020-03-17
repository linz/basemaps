import { EPSG } from '@basemaps/geo';
import { TileSetType, VNode } from '@basemaps/lambda-shared';
import * as o from 'ospec';
import { buildWmtsCapability, buildWmtsCapabilityToVNode } from '../wmts-capability';
import { createHash } from 'crypto';

const listTag = (node: VNode, tag: string): string[] => Array.from(node.tags(tag)).map(n => n.toString());

o.spec('wmts', () => {
    o('should build capabiltiy xml for tileset and projection', () => {
        const raw = buildWmtsCapabilityToVNode('https://basemaps.test', TileSetType.aerial, EPSG.Google);

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
                'template="https://basemaps.test/tiles/aerial/3857/{TileMatrix}/{TileCol}/{TileRow}.png">' +
                '</ResourceURL>',
        );

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
                '  <MatrixWidth>11</MatrixWidth>\n' +
                '  <MatrixHeight>11</MatrixHeight>\n' +
                '</TileMatrix>',
        );
    });

    o('should return null if not found', () => {
        o(buildWmtsCapability('basemaps.test', TileSetType.aerial, EPSG.Wgs84)).equals(null);
    });

    o('should build capabiltiy xml for tileset and all projections', () => {
        const raw = buildWmtsCapabilityToVNode('https://basemaps.test', TileSetType.aerial, null);

        if (raw == null) {
            o(raw).notEquals(null);
            return;
        }

        o(listTag(raw, 'ResourceURL')[0]).deepEquals(
            '<ResourceURL format="image/png" resourceType="tile" ' +
                'template="https://basemaps.test/tiles/aerial/{TileMatrix}/{TileCol}/{TileRow}.png">' +
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
                '  <MatrixWidth>20</MatrixWidth>\n' +
                '  <MatrixHeight>20</MatrixHeight>\n' +
                '</TileMatrix>',
        );

        const xml = buildWmtsCapability('https://basemaps.test', TileSetType.aerial, null) || '';

        o(xml).equals('<?xml version="1.0"?>\n' + raw.toString());

        o(
            createHash('sha256')
                .update(Buffer.from(xml))
                .digest('base64'),
        ).equals('ZFDOSpWK2PHHS/ITbcWBEctM/ekO8CIBfk3KSbKdFfo=');
    });
});

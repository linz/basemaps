import { EPSG } from '@basemaps/geo';
import { HttpHeader, VNodeElement } from '@basemaps/lambda-shared';
import { createHash } from 'crypto';
import * as o from 'ospec';
import { TileSet } from '../tile.set';
import { TileSets } from '../tile.set.cache';
import { buildWmtsCapability, buildWmtsCapabilityToVNode } from '../wmts.capability';
import { mockRequest, addTitleAndDesc } from './xyz.testhelper';

const listTag = (node: VNodeElement, tag: string): string[] => Array.from(node.tags(tag)).map((n) => n.toString());

const TileSetNames = ['aerial', 'aerial@beta', '01E7PJFR9AMQFJ05X9G7FQ3XMW'];

o.spec('wmts', () => {
    o.beforeEach(() => {
        for (const name of TileSetNames) {
            const tileSet = new TileSet(name, EPSG.Google, 'test_bucket');
            addTitleAndDesc(tileSet);
            TileSets.set(tileSet.id, tileSet);
        }
    });

    o.afterEach(() => {
        TileSets.clear();
    });

    o('should build capabiltiy xml for tileset and projection', () => {
        const req = mockRequest('/v1/tiles/aerial@beta/3857/WMTSCapabilities.xml', 'get', {
            [HttpHeader.ApiKey]: 'secret1234',
        });
        const raw = buildWmtsCapabilityToVNode('https://basemaps.test', req, TileSets.get('aerial@beta_3857')!);

        if (raw == null) {
            o(raw).notEquals(null);
            return;
        }

        o(listTag(raw, 'ows:Abstract')).deepEquals([
            '<ows:Abstract>National Mapping Service provided by Land Information New Zealand</ows:Abstract>',
            '<ows:Abstract>The Description</ows:Abstract>',
        ]);

        o(listTag(raw, 'ows:Title')).deepEquals([
            '<ows:Title>National Base Mapping Service (LINZ)</ows:Title>',
            '<ows:Title>The Title</ows:Title>',
        ]);

        o(listTag(raw, 'TileMatrixSetLink')).deepEquals([
            '<TileMatrixSetLink>\n' +
                '  <TileMatrixSet>GoogleMapsCompatible</TileMatrixSet>\n' +
                '</TileMatrixSetLink>',
        ]);

        o(listTag(raw, 'Format')).deepEquals([
            '<Format>image/png</Format>',
            '<Format>image/webp</Format>',
            '<Format>image/jpeg</Format>',
        ]);

        o(listTag(raw, 'ows:WGS84BoundingBox')).deepEquals([
            '<ows:WGS84BoundingBox crs="urn:ogc:def:crs:OGC:2:84">\n' +
                '  <ows:LowerCorner>-180 -85.0511287798066</ows:LowerCorner>\n' +
                '  <ows:UpperCorner>180 85.0511287798066</ows:UpperCorner>\n' +
                '</ows:WGS84BoundingBox>',
        ]);

        const urls = Array.from(raw.tags('ResourceURL'));
        o(urls.length).equals(3);
        o(urls[0].toString()).deepEquals(
            '<ResourceURL format="image/png" resourceType="tile" ' +
                'template="https://basemaps.test/v1/tiles/aerial@beta/3857/{TileMatrix}/{TileCol}/{TileRow}.png?api=secret1234" />',
        );

        const tileMatrixSet = Array.from(raw.tags('TileMatrixSet'));
        o(tileMatrixSet.length).equals(2);

        o(listTag(tileMatrixSet[1], 'ows:Identifier')[0]).equals(
            '<ows:Identifier>GoogleMapsCompatible</ows:Identifier>',
        );
        o(listTag(tileMatrixSet[1], 'ows:SupportedCRS')).deepEquals([
            '<ows:SupportedCRS>urn:ogc:def:crs:EPSG::3857</ows:SupportedCRS>',
        ]);

        o(listTag(tileMatrixSet[1], 'WellKnownScaleSet')).deepEquals([
            '<WellKnownScaleSet>urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible</WellKnownScaleSet>',
        ]);

        const tileMatrices = Array.from(raw.tags('TileMatrix'));

        o(tileMatrices.length).equals(22);

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

        const xml = buildWmtsCapability('https://basemaps.test', req, TileSets.get('aerial@beta_3857')!)!;

        o(xml).deepEquals('<?xml version="1.0"?>\n' + raw.toString());

        o(createHash('sha256').update(Buffer.from(xml)).digest('base64')).equals(
            '0k3eedbALsdZdISLae8M/SSQNwZb8iZSaQJ0722ssZA=',
        );
    });

    o('should return null if not found', () => {
        const req = mockRequest('/v1/tiles/aerial/4326/WMTSCapabilities.xml');
        const ts = new TileSet('aerial', EPSG.Nztm, 'test_bucket');
        addTitleAndDesc(ts);

        o(buildWmtsCapability('basemaps.test', req, ts)).equals(null);
    });

    o('should allow empty api key', () => {
        const raw = buildWmtsCapabilityToVNode(
            'https://basemaps.test',
            mockRequest('/v1/tiles/01E7PJFR9AMQFJ05X9G7FQ3XMW/3857/WMTSCapabilities.xml'),
            TileSets.get('01E7PJFR9AMQFJ05X9G7FQ3XMW_3857')!,
        );

        const urls = Array.from(raw ? raw.tags('ResourceURL') : []);
        o(urls.length).equals(3);
        o(urls[0].toString()).deepEquals(
            '<ResourceURL format="image/png" resourceType="tile" ' +
                'template="https://basemaps.test/v1/tiles/01E7PJFR9AMQFJ05X9G7FQ3XMW/3857/{TileMatrix}/{TileCol}/{TileRow}.png" />',
        );
    });
});

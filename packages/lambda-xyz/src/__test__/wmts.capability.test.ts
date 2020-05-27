import { Epsg } from '@basemaps/geo';
import { HttpHeader, VNodeElement } from '@basemaps/lambda-shared';
import { createHash } from 'crypto';
import * as o from 'ospec';
import { TileSet } from '../tile.set';
import { TileSets } from '../tile.set.cache';
import { buildWmtsCapability, buildWmtsCapabilityToVNode } from '../wmts.capability';
import { addTitleAndDesc, mockRequest, Provider } from './xyz.testhelper';

const listTag = (node: VNodeElement, tag: string): string[] => Array.from(node.tags(tag)).map((n) => n.toString());

const TileSetNames = ['aerial', 'aerial@beta', '01E7PJFR9AMQFJ05X9G7FQ3XMW'];

o.spec('wmts', () => {
    o.beforeEach(() => {
        for (const name of TileSetNames) {
            const tileSet = new TileSet(name, Epsg.Google);
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
        const raw = buildWmtsCapabilityToVNode(
            'https://basemaps.test',
            req,
            Provider,
            TileSets.get('aerial@beta_3857')!,
        )!;

        const serviceId = raw.find('ows:ServiceIdentification')!;

        o(serviceId.find('ows:Abstract')!.textContent).equals('the description');
        o(serviceId.find('ows:Title')!.textContent).equals('the title');

        o(listTag(raw, 'TileMatrixSetLink')).deepEquals([
            '<TileMatrixSetLink>\n' +
                '  <TileMatrixSet>GoogleMapsCompatible</TileMatrixSet>\n' +
                '</TileMatrixSetLink>',
        ]);

        const layer = raw.find('Contents', 'Layer')!;

        o(listTag(layer, 'Format')).deepEquals([
            '<Format>image/png</Format>',
            '<Format>image/webp</Format>',
            '<Format>image/jpeg</Format>',
        ]);

        o(listTag(layer, 'ows:WGS84BoundingBox')).deepEquals([
            '<ows:WGS84BoundingBox crs="urn:ogc:def:crs:OGC:2:84">\n' +
                '  <ows:LowerCorner>-180 -85.0511287798066</ows:LowerCorner>\n' +
                '  <ows:UpperCorner>180 85.0511287798066</ows:UpperCorner>\n' +
                '</ows:WGS84BoundingBox>',
        ]);

        o(layer.find('ows:Abstract')!.textContent).equals('The Description');
        o(layer.find('ows:Title')!.textContent).equals('The Title');

        const urls = Array.from(layer.tags('ResourceURL'));
        o(urls.length).equals(3);
        o(urls[0].toString()).deepEquals(
            '<ResourceURL format="image/png" resourceType="tile" ' +
                'template="https://basemaps.test/v1/tiles/aerial@beta/3857/{TileMatrix}/{TileCol}/{TileRow}.png?api=secret1234" />',
        );

        o(layer.find('TileMatrixSetLink', 'TileMatrixSet')!.textContent).equals('GoogleMapsCompatible');

        const matrix = Array.from(raw.tags('TileMatrixSet'))[1]!;
        const matrixId = raw.find('Contents', 'TileMatrixSet', 'ows:Identifier')!;
        o(matrix.find('ows:Identifier')).equals(matrixId);
        o(matrixId.textContent).equals('GoogleMapsCompatible');

        o(matrix.find('ows:SupportedCRS')!.textContent).deepEquals('urn:ogc:def:crs:EPSG::3857');
        o(matrix.find('WellKnownScaleSet')!.textContent).deepEquals('urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible');

        const tileMatrices = Array.from(matrix.tags('TileMatrix'));

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

        const xml = buildWmtsCapability('https://basemaps.test', req, Provider, TileSets.get('aerial@beta_3857')!)!;

        o(xml).deepEquals('<?xml version="1.0"?>\n' + raw.toString());

        o(createHash('sha256').update(Buffer.from(xml)).digest('base64')).equals(
            'Y6X5Q9VqbY+Y7wRUhKMCIk/V7OQIkCXD20xGmsiuFlc=',
        );
    });

    o('should return null if not found', () => {
        const req = mockRequest('/v1/tiles/aerial/4326/WMTSCapabilities.xml');
        const ts = new TileSet('aerial', Epsg.Nztm2000);
        addTitleAndDesc(ts);

        o(buildWmtsCapability('basemaps.test', req, Provider, ts)).equals(null);
    });

    o('should allow individual imagery sets', () => {
        const raw = buildWmtsCapabilityToVNode(
            'https://basemaps.test',
            mockRequest('/v1/tiles/01E7PJFR9AMQFJ05X9G7FQ3XMW/3857/WMTSCapabilities.xml'),
            Provider,
            TileSets.get('01E7PJFR9AMQFJ05X9G7FQ3XMW_3857')!,
        )!;

        const tms = raw?.find('TileMatrixSet', 'ows:Identifier')!;

        o(tms.textContent).equals('GoogleMapsCompatible');

        const urls = Array.from(raw ? raw.tags('ResourceURL') : []);
        o(urls.length).equals(3);
        o(urls[0].toString()).deepEquals(
            '<ResourceURL format="image/png" resourceType="tile" ' +
                'template="https://basemaps.test/v1/tiles/01E7PJFR9AMQFJ05X9G7FQ3XMW/3857/{TileMatrix}/{TileCol}/{TileRow}.png" />',
        );
    });
});

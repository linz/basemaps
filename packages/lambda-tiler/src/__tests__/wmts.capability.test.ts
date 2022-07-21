import { ConfigImagery } from '@basemaps/config';
import { GoogleTms, ImageFormat, Nztm2000QuadTms, Nztm2000Tms } from '@basemaps/geo';
import { Projection, V, VNodeElement } from '@basemaps/shared';
import { Nztm2000 } from '@basemaps/shared/src/proj/nztm2000.js';
import { roundNumbersInString } from '@basemaps/test/build/rounding.js';
import { Wgs84 } from '@linzjs/geojson';
import { writeFileSync } from 'fs';
import o from 'ospec';
import { WmtsCapabilities } from '../wmts.capability.js';
import { Imagery2193, Imagery3857, Provider, TileSetAerial } from './config.data.js';

function tags(node: VNodeElement | null | undefined, tag: string): VNodeElement[] {
  if (node == null) return [];
  return [...node.tags(tag)];
}
function listTag(node: VNodeElement | null | undefined, tag: string): string[] {
  return tags(node, tag).map((n) => n.toString());
}

o.spec('WmtsCapabilities', () => {
  const apiKey = 'secret1234';

  const allImagery = new Map();
  allImagery.set(Imagery2193.id, Imagery2193);
  allImagery.set(Imagery3857.id, Imagery3857);

  o('should output the requested formats', () => {
    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet: TileSetAerial,
      imagery: allImagery,
      apiKey,
      formats: [ImageFormat.Avif],
      isIndividualLayers: false,
    }).toVNode();

    const urls = tags(wmts, 'ResourceURL');
    o(urls.length).equals(1);
    o(urls[0].attrs.format).equals('image/avif');
    o(urls[0].attrs.template).equals(
      'https://basemaps.test/v1/tiles/aerial/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.avif?api=secret1234',
    );
  });

  o('should be seting encoding to utf-8', () => {
    const xml = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet: TileSetAerial,
      imagery: allImagery,
      apiKey,
      formats: [ImageFormat.Avif],
      isIndividualLayers: false,
    }).toXml();

    o(xml.split('\n')[0]).deepEquals('<?xml version="1.0" encoding="utf-8"?>');
  });

  o('should support unicorns and rainbows', () => {
    const tileSet = { ...TileSetAerial };
    tileSet.name = '🦄_🌈_2022_0-5m';
    tileSet.title = '🦄 🌈 Imagery (2022)';
    tileSet.description = '🦄 🌈 Description';
    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet,
      imagery: allImagery,
      apiKey,
      formats: [ImageFormat.Avif],
      isIndividualLayers: false,
    }).toVNode();

    const urls = tags(wmts, 'ResourceURL');
    o(urls.length).equals(1);
    o(urls[0].attrs.template).equals(
      'https://basemaps.test/v1/tiles/🦄-🌈-2022-0.5m/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.avif?api=secret1234',
    );

    const layer = tags(wmts, 'Layer')[0];

    const title = layer.find('ows:Title')?.toString();
    o(title).equals('<ows:Title>🦄 🌈 Imagery (2022)</ows:Title>');

    const abstract = layer.find('ows:Abstract')?.toString();
    o(abstract).equals('<ows:Abstract>🦄 🌈 Description</ows:Abstract>');

    const identifier = layer.find('ows:Identifier')?.toString();
    o(identifier).equals('<ows:Identifier>🦄-🌈-2022-0.5m</ows:Identifier>');
  });

  o('should sort the sub imagery layers', () => {
    const imageryA = { ...Imagery3857 };
    imageryA.id = 'im_a';
    imageryA.name = 'aaaa';
    imageryA.title = 'aaaa';

    const imageryB = { ...Imagery3857 };
    imageryB.id = 'im_b';
    imageryB.name = 'bbbb';
    imageryB.title = 'bbbb';

    const imagery = new Map();
    imagery.set(Imagery3857.id, Imagery3857);
    imagery.set(imageryB.id, imageryB);
    imagery.set(imageryA.id, imageryA);
    const tileSet = {
      ...TileSetAerial,
      layers: [
        ...TileSetAerial.layers,
        { [3857]: imageryB.id, title: imageryB.title, name: imageryB.name },
        { [3857]: imageryA.id, title: imageryA.title, name: imageryA.name },
      ],
    };

    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet,
      imagery,
      apiKey,
      isIndividualLayers: true,
    }).toVNode();

    const layers = tags(wmts, 'Layer').map((c) => c.find('ows:Title')?.textContent);

    // The base layer "Aerial Imagery" should always be first then all sub layers after
    o(layers).deepEquals(['Aerial Imagery', 'aaaa', 'bbbb', 'Ōtorohanga 0.1m Urban Aerial Photos (2021)']);
  });

  o('should build capability xml for tileset and projection', () => {
    const imagery = new Map();
    imagery.set(Imagery3857.id, Imagery3857);
    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet: TileSetAerial,
      imagery,
      apiKey,
      isIndividualLayers: false,
    });

    const raw = wmts.toVNode();
    const serviceId = raw.find('ows:ServiceIdentification');

    o(serviceId?.find('ows:Abstract')?.textContent).equals('the description');
    o(serviceId?.find('ows:Title')?.textContent).equals('the title');

    o(raw.find('TileMatrixSetLink')?.toString()).deepEquals(
      V('TileMatrixSetLink', [V('TileMatrixSet', 'WebMercatorQuad')]).toString(),
    );

    const layer = raw.find('Contents', 'Layer');

    o(listTag(layer, 'Format')).deepEquals([
      V('Format', 'image/jpeg').toString(),
      V('Format', 'image/webp').toString(),
      V('Format', 'image/png').toString(),
    ]);

    o(listTag(layer, 'ows:BoundingBox').map((s) => roundNumbersInString(s, 4))).deepEquals([
      '<ows:BoundingBox crs="urn:ogc:def:crs:EPSG::3857">\n' +
        '  <ows:LowerCorner>19457809.9203 -4609458.5537</ows:LowerCorner>\n' +
        '  <ows:UpperCorner>19509787.0995 -4578883.7424</ows:UpperCorner>\n' +
        '</ows:BoundingBox>',
    ]);

    o(listTag(layer, 'ows:WGS84BoundingBox').map((s) => roundNumbersInString(s, 4))).deepEquals([
      '<ows:WGS84BoundingBox crs="urn:ogc:def:crs:OGC:2:84">\n' +
        '  <ows:LowerCorner>174.7925 -38.2123</ows:LowerCorner>\n' +
        '  <ows:UpperCorner>175.2594 -37.9962</ows:UpperCorner>\n' +
        '</ows:WGS84BoundingBox>',
    ]);

    o(layer?.find('ows:Identifier')?.textContent).equals('aerial');
    o(layer?.find('ows:Title')?.textContent).equals('Aerial Imagery');
    o(layer?.find('ows:Abstract')?.textContent).equals('aerial__description');

    o(layer?.find('Style')?.toString()).equals(
      V('Style', { isDefault: 'true' }, [V('ows:Title', 'Default Style'), V('ows:Identifier', 'default')]).toString(),
    );
  });

  o('should include output the correct TileMatrix', () => {
    const raw = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet: TileSetAerial,
      imagery: allImagery,
      apiKey,
      isIndividualLayers: false,
    }).toVNode();
    const layer = raw.find('Contents', 'Layer');

    o(layer?.find('TileMatrixSetLink', 'TileMatrixSet')?.textContent).equals('WebMercatorQuad');

    const matrix = tags(raw, 'TileMatrixSet')[1];
    const matrixId = raw?.find('Contents', 'TileMatrixSet', 'ows:Identifier') ?? null;
    o(matrix.find('ows:Identifier')).equals(matrixId);
    o(matrixId?.textContent).equals('WebMercatorQuad');

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
  });

  o('should output individual imagery sets', () => {
    const imagery = new Map<string, ConfigImagery>();
    imagery.set(Imagery3857.id, Imagery3857);
    imagery.set(Imagery2193.id, Imagery2193);
    const raw = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet: TileSetAerial,
      imagery: imagery,
      formats: [ImageFormat.Png],
      isIndividualLayers: true,
    }).toVNode();

    const tms = raw?.find('TileMatrixSet', 'ows:Identifier');

    o(tms?.textContent).equals('WebMercatorQuad');

    const urls = Array.from(raw ? raw.tags('ResourceURL') : []);
    o(urls.length).equals(2);
    o(urls[0].toString()).deepEquals(
      '<ResourceURL format="image/png" resourceType="tile" ' +
        'template="https://basemaps.test/v1/tiles/aerial/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png" />',
    );
    o(urls[1].toString()).deepEquals(
      '<ResourceURL format="image/png" resourceType="tile" ' +
        'template="https://basemaps.test/v1/tiles/ōtorohanga-urban-2021-0.1m/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png" />',
    );

    const layers = [...raw.tags('Layer')];

    o(layers.length).equals(2);
    o(layers[0].find('ows:Title')?.textContent).equals('Aerial Imagery');

    o(layers[1].find('ows:Title')?.textContent).equals('Ōtorohanga 0.1m Urban Aerial Photos (2021)');
    o(layers[1].find('ows:Identifier')?.textContent).equals('ōtorohanga-urban-2021-0.1m');
    o(layers[1].find('ows:Keywords', 'ows:Keyword')?.textContent).equals('Urban Aerial Photos');
  });

  o('should support multiple projections', () => {
    const imagery = new Map<string, ConfigImagery>();
    imagery.set(Imagery3857.id, Imagery3857);
    imagery.set(Imagery2193.id, Imagery2193);
    const raw = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms, Nztm2000QuadTms],
      tileSet: TileSetAerial,
      imagery: imagery,
      formats: [ImageFormat.Png],
      isIndividualLayers: false,
    }).toVNode();

    const layers = tags(raw, 'Layer');
    o(layers.length).equals(1);
    const layer = layers[0];

    // ensure order is valid
    o(layer?.children.map((c) => (c instanceof VNodeElement ? c.tag : null))).deepEquals([
      'ows:Title',
      'ows:Abstract',
      'ows:Identifier',
      'ows:Keywords',
      'ows:BoundingBox',
      'ows:BoundingBox',
      'ows:WGS84BoundingBox',
      'Style',
      'Format',
      'TileMatrixSetLink',
      'TileMatrixSetLink',
      'ResourceURL',
    ]);

    o(layer.find('ows:Title')?.textContent).equals('Aerial Imagery');
    o(layer.find('ows:Keywords')?.toString()).equals(
      '<ows:Keywords>\n  <ows:Keyword>Basemap</ows:Keyword>\n</ows:Keywords>',
    );
    o(layer.find('ows:Identifier')?.textContent).equals('aerial');

    const sets = tags(layer, 'TileMatrixSet');

    o(sets.length).equals(2);
    o(sets[0].toString()).equals('<TileMatrixSet>WebMercatorQuad</TileMatrixSet>');
    o(sets[1].toString()).equals('<TileMatrixSet>NZTM2000Quad</TileMatrixSet>');

    const boundingBoxes = tags(layer, 'ows:BoundingBox');
    o(boundingBoxes.length).equals(2);
    o(boundingBoxes[0].attrs.crs).equals('urn:ogc:def:crs:EPSG::3857');
    o(boundingBoxes[0].children.map((c) => roundNumbersInString(c.textContent, 4))).deepEquals([
      '19457809.9203 -4609458.5537',
      '19509787.0995 -4578883.7424',
    ]);
    o(boundingBoxes[1].attrs.crs).equals('urn:ogc:def:crs:EPSG::2193');
    o(boundingBoxes[1].children.map((c) => roundNumbersInString(c.textContent, 4))).deepEquals([
      '5766358.9964 1757351.3045',
      '5793264.8304 1798321.5516',
    ]);

    const wgs84 = layer.find('ows:WGS84BoundingBox');
    o(wgs84?.attrs.crs).equals('urn:ogc:def:crs:OGC:2:84');
    o(wgs84?.children.map((c) => roundNumbersInString(c.textContent, 4))).deepEquals([
      '174.7925 -38.2123',
      '175.2594 -37.9962',
    ]);
  });

  o('should only output imagery if exists', () => {
    const imagery = new Map<string, ConfigImagery>();
    const raw = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [Nztm2000QuadTms],
      tileSet: TileSetAerial,
      imagery: imagery,
      formats: [ImageFormat.Png],
      isIndividualLayers: true,
    }).toVNode();

    const layers = tags(raw, 'Layer');
    o(layers.length).equals(1);

    imagery.set(Imagery3857.id, Imagery3857);
    const rawB = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [Nztm2000QuadTms],
      tileSet: TileSetAerial,
      imagery: imagery,
      formats: [ImageFormat.Png],
      isIndividualLayers: true,
    }).toVNode();

    const layersB = tags(rawB, 'Layer');
    o(layersB.length).equals(1);
  });

  o('should cover the entire WebMercatorBounds', () => {
    const halfSize = GoogleTms.extent.width / 2;
    // Create two fake imagery sets one covers tile z1 x0 y0 another covers tile z1 x1 y1
    // so the entire bounding box should be tile z0 x0 y0 or the full extent
    const imagery = new Map();
    const imageTopLeft = { ...Imagery3857, id: 'im_top_left', name: 'top_left' };
    imageTopLeft.bounds = { x: -halfSize, y: 0, width: halfSize, height: halfSize };
    imagery.set(imageTopLeft.id, imageTopLeft);

    const imageBottomRight = { ...Imagery3857, id: 'im_bottom_right', name: 'bottom_right' };
    imageBottomRight.bounds = { x: 0, y: -halfSize, width: halfSize, height: halfSize };
    imagery.set(imageBottomRight.id, imageBottomRight);

    const tileSet = { ...TileSetAerial };
    tileSet.layers = [
      { 3857: imageTopLeft.id, name: 'a_top_left' },
      { 3857: imageBottomRight.id, name: 'b_bottom_right' },
    ];

    const raw = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet,
      imagery,
      formats: [ImageFormat.Png],
      isIndividualLayers: true,
    }).toVNode();

    const boundingBox = tags(raw, 'ows:WGS84BoundingBox').map((c) =>
      roundNumbersInString(c.toString(), 4)
        .split('\n')
        .map((c) => c.trim()),
    );
    o(boundingBox[0][1]).deepEquals('<ows:LowerCorner>-180 -85.0511</ows:LowerCorner>');
    o(boundingBox[0][2]).equals('<ows:UpperCorner>180 85.0511</ows:UpperCorner>');

    o(boundingBox[1][1]).deepEquals('<ows:LowerCorner>-180 0</ows:LowerCorner>');
    o(boundingBox[1][2]).equals('<ows:UpperCorner>0 85.0511</ows:UpperCorner>');

    o(boundingBox[2][1]).deepEquals('<ows:LowerCorner>0 -85.0511</ows:LowerCorner>');
    o(boundingBox[2][2]).equals('<ows:UpperCorner>180 0</ows:UpperCorner>');
  });

  o('should work when crossing anti meridian', () => {
    const halfSize = GoogleTms.extent.width / 2;

    const imagery = new Map();
    // This image covers z1 x1.5 y1 to z1 x0.5 y1
    // which cross the AM and covers half the width of two tiles
    const imageBottomRight = { ...Imagery3857, id: 'im_bottom_right', name: 'bottom_right' };
    imageBottomRight.bounds = { x: halfSize / 2, y: -halfSize, width: halfSize, height: halfSize };
    imagery.set(imageBottomRight.id, imageBottomRight);

    const tileSet = { ...TileSetAerial };
    tileSet.layers = [{ 3857: imageBottomRight.id, name: 'b_bottom_right' }];

    const raw = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet,
      imagery,
      formats: [ImageFormat.Png],
      isIndividualLayers: true,
    }).toVNode();

    const boundingBox = tags(raw, 'ows:WGS84BoundingBox').map((c) =>
      roundNumbersInString(c.toString(), 4)
        .split('\n')
        .map((c) => c.trim()),
    );
    o(boundingBox[0][1]).deepEquals('<ows:LowerCorner>-180 -85.0511</ows:LowerCorner>');
    o(boundingBox[0][2]).equals('<ows:UpperCorner>180 0</ows:UpperCorner>');

    o(boundingBox[1][1]).deepEquals('<ows:LowerCorner>-180 -85.0511</ows:LowerCorner>');
    o(boundingBox[1][2]).equals('<ows:UpperCorner>180 0</ows:UpperCorner>');
  });

  o('should work with NZTM2000Quad', () => {
    const wmts = new WmtsCapabilities({ tileMatrix: [] } as any);

    // Full NZTM200Quad coverage
    const bbox = wmts.buildWgs84BoundingBox(Nztm2000QuadTms, []);
    o(bbox.children[0].textContent).equals('-180.000000 -49.9299');
    o(bbox.children[1].textContent).equals('180.000000 2.93860');

    // Full NZTM200Quad coverage at z1
    const bboxB = wmts.buildWgs84BoundingBox(Nztm2000QuadTms, [
      Nztm2000QuadTms.tileToSourceBounds({ z: 1, x: 0, y: 0 }),
      Nztm2000QuadTms.tileToSourceBounds({ z: 1, x: 1, y: 1 }),
    ]);
    o(bboxB.children[0].textContent).equals('-180.000000 -49.9299');
    o(bboxB.children[1].textContent).equals('180.000000 2.93860');

    // Full NZTM200Quad coverage at z5
    const tileCount = Nztm2000QuadTms.zooms[5].matrixWidth;
    const bboxC = wmts.buildWgs84BoundingBox(Nztm2000QuadTms, [
      Nztm2000QuadTms.tileToSourceBounds({ z: 5, x: 0, y: 0 }),
      Nztm2000QuadTms.tileToSourceBounds({ z: 5, x: tileCount - 1, y: tileCount - 1 }),
    ]);
    o(bboxC.children[0].textContent).equals('-180.000000 -49.9299');
    o(bboxC.children[1].textContent).equals('180.000000 2.93860');
  });
});

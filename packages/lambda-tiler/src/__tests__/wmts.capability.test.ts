import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ConfigImagery } from '@basemaps/config';
import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';
import { V, VNodeElement } from '@basemaps/shared';
import { roundNumbersInString } from '@basemaps/test/build/rounding.js';

import { WmtsCapabilities } from '../wmts.capability.js';
import { Imagery2193, Imagery3857, Provider, TileSetAerial } from './config.data.js';

function tags(node: VNodeElement | null | undefined, tag: string): VNodeElement[] {
  if (node == null) return [];
  return [...node.tags(tag)];
}
function listTag(node: VNodeElement | null | undefined, tag: string): string[] {
  return tags(node, tag).map((n) => n.toString());
}

describe('WmtsCapabilities', () => {
  const apiKey = 'secret1234';

  const allImagery = new Map();
  allImagery.set(Imagery2193.id, Imagery2193);
  allImagery.set(Imagery3857.id, Imagery3857);

  it('should output the requested formats', () => {
    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      apiKey,
    });

    wmts.addTileMatrix(GoogleTms);
    for (const im of allImagery.values()) wmts.addImagery(im);
    wmts.addFormats('avif');
    wmts.addProvider(Provider);
    wmts.addTileSet(TileSetAerial);
    const wmtsCapability = wmts.toVNode();

    const urls = tags(wmtsCapability, 'ResourceURL');
    assert.equal(urls.length, 1);
    assert.equal(urls[0].attrs['format'], 'image/avif');
    assert.equal(
      urls[0].attrs['template'],
      'https://basemaps.test/v1/tiles/aerial/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.avif?api=secret1234',
    );
  });

  it('should include config location', () => {
    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      apiKey,
      config: 's3://linz-basemaps/config.json',
    });

    wmts.addTileMatrix(GoogleTms);
    for (const im of allImagery.values()) wmts.addImagery(im);
    wmts.addFormats('avif');
    wmts.addProvider(Provider);
    wmts.addTileSet(TileSetAerial);
    const wmtsCapability = wmts.toVNode();

    const urls = tags(wmtsCapability, 'ResourceURL');
    assert.equal(urls.length, 1);
    assert.equal(urls[0].attrs['format'], 'image/avif');
    assert.equal(
      urls[0].attrs['template'],
      'https://basemaps.test/v1/tiles/aerial/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.avif?api=secret1234&config=s3%3A%2F%2Flinz-basemaps%2Fconfig.json',
    );
  });

  it('should be adding encoding to utf-8', () => {
    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      apiKey,
    });

    wmts.fromParams({
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet: TileSetAerial,
      imagery: allImagery,
      formats: ['avif'],
    });
    const xml = wmts.toXml();

    assert.deepEqual(xml.split('\n')[0], '<?xml version="1.0" encoding="utf-8"?>');
  });

  it('should support unicorns and rainbows', () => {
    const tileSet = { ...TileSetAerial };
    tileSet.name = '🦄_🌈_2022_0-5m';
    tileSet.title = '🦄 🌈 Imagery (2022)';
    tileSet.description = '🦄 🌈 Description';

    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      apiKey,
    });

    wmts.addTileMatrix(GoogleTms);
    for (const im of allImagery.values()) wmts.addImagery(im);
    wmts.addFormats('avif');
    wmts.addProvider(Provider);
    wmts.addTileSet(tileSet);
    const wmtsCapability = wmts.toVNode();

    const urls = tags(wmtsCapability, 'ResourceURL');
    assert.equal(urls.length, 1);
    assert.equal(
      urls[0].attrs['template'],
      'https://basemaps.test/v1/tiles/🦄-🌈-2022-0.5m/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.avif?api=secret1234',
    );

    const layer = tags(wmtsCapability, 'Layer')[0];

    const title = layer.find('ows:Title')?.toString();
    assert.equal(title, '<ows:Title>🦄 🌈 Imagery (2022)</ows:Title>');

    const abstract = layer.find('ows:Abstract')?.toString();
    assert.equal(abstract, '<ows:Abstract>🦄 🌈 Description</ows:Abstract>');

    const identifier = layer.find('ows:Identifier')?.toString();
    assert.equal(identifier, '<ows:Identifier>🦄-🌈-2022-0.5m</ows:Identifier>');
  });

  it('should sort the sub imagery layers', () => {
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
      apiKey,
    });

    wmts.addTileMatrix(GoogleTms);
    for (const im of imagery.values()) wmts.addImagery(im);
    wmts.addProvider(Provider);
    wmts.addTileSet(tileSet);
    wmts.addLayers(tileSet.layers);
    const wmtsCapability = wmts.toVNode();

    const layers = tags(wmtsCapability, 'Layer').map((c) => c.find('ows:Title')?.textContent);

    // The base layer "Aerial Imagery" should always be first then all sub layers after
    assert.deepEqual(layers, ['Aerial Imagery', 'aaaa', 'bbbb', 'Ōtorohanga 0.1m Urban Aerial Photos (2021)']);
  });

  it('should build capability xml for tileSet and projection', () => {
    const imagery = new Map();
    imagery.set(Imagery3857.id, Imagery3857);

    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      apiKey,
    });

    wmts.addTileMatrix(GoogleTms);
    for (const im of imagery.values()) wmts.addImagery(im);
    wmts.addProvider(Provider);
    wmts.addTileSet(TileSetAerial);
    wmts.addLayers(TileSetAerial.layers);
    const raw = wmts.toVNode();
    const serviceId = raw.find('ows:ServiceIdentification');

    assert.equal(serviceId?.find('ows:Abstract')?.textContent, 'the description');
    assert.equal(serviceId?.find('ows:Title')?.textContent, 'the title');

    assert.deepEqual(
      raw.find('TileMatrixSetLink')?.toString(),
      V('TileMatrixSetLink', [V('TileMatrixSet', 'WebMercatorQuad')]).toString(),
    );

    const layer = raw.find('Contents', 'Layer');

    assert.deepEqual(listTag(layer, 'Format'), [
      V('Format', 'image/jpeg').toString(),
      V('Format', 'image/webp').toString(),
      V('Format', 'image/png').toString(),
    ]);

    assert.deepEqual(
      listTag(layer, 'ows:BoundingBox').map((s) => roundNumbersInString(s, 4)),
      [
        '<ows:BoundingBox crs="urn:ogc:def:crs:EPSG::3857">\n' +
          '  <ows:LowerCorner>19457809.9203 -4609458.5537</ows:LowerCorner>\n' +
          '  <ows:UpperCorner>19509787.0995 -4578883.7424</ows:UpperCorner>\n' +
          '</ows:BoundingBox>',
      ],
    );

    assert.deepEqual(
      listTag(layer, 'ows:WGS84BoundingBox').map((s) => roundNumbersInString(s, 4)),
      [
        '<ows:WGS84BoundingBox crs="urn:ogc:def:crs:OGC:2:84">\n' +
          '  <ows:LowerCorner>174.7925 -38.2123</ows:LowerCorner>\n' +
          '  <ows:UpperCorner>175.2594 -37.9962</ows:UpperCorner>\n' +
          '</ows:WGS84BoundingBox>',
      ],
    );

    assert.equal(layer?.find('ows:Identifier')?.textContent, 'aerial');
    assert.equal(layer?.find('ows:Title')?.textContent, 'Aerial Imagery');
    assert.equal(layer?.find('ows:Abstract')?.textContent, 'aerial__description');

    assert.equal(
      layer?.find('Style')?.toString(),
      V('Style', { isDefault: 'true' }, [V('ows:Title', 'Default Style'), V('ows:Identifier', 'default')]).toString(),
    );
  });

  it('should limit a bounding box to the tileMatrix extent WebMercatorQuad', () => {
    const wmts = new WmtsCapabilities({ httpBase: 'https://basemaps.test', apiKey });

    const bigImagery = new Map();
    bigImagery.set(Imagery3857.id, {
      ...Imagery3857,
      bounds: {
        // These bounds are slightly outside the extent bounds of 3857 (approx 0.3m offset)
        // {x: -20037508.34 y:-20037508.34, width: 40075016.6855784 , height: 40075016.6855784 }
        x: -20037508.6276,
        y: -20037508.6276,
        width: 40075016.9626,
        height: 40075014.197799996,
      },
    });

    wmts.fromParams({
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet: TileSetAerial,
      imagery: bigImagery,
      formats: ['png'],
    });
    const raw = wmts.toVNode();

    const wgs84 = raw.find('Contents', 'Layer', 'ows:WGS84BoundingBox');
    const epsg3857 = raw.find('Contents', 'Layer', 'ows:BoundingBox');

    assert.equal(
      epsg3857?.find('ows:LowerCorner')?.toString(),
      `<ows:LowerCorner>-20037508.3428 -20037508.3428</ows:LowerCorner>`,
    );
    assert.equal(
      epsg3857?.find('ows:UpperCorner')?.toString(),
      `<ows:UpperCorner>20037508.3428 20037508.3428</ows:UpperCorner>`,
    );

    assert.equal(wgs84?.find('ows:LowerCorner')?.toString(), '<ows:LowerCorner>-180 -85.051129</ows:LowerCorner>');
    assert.equal(wgs84?.find('ows:UpperCorner')?.toString(), '<ows:UpperCorner>180 85.051129</ows:UpperCorner>');
  });

  it('should limit a bounding box to the tileMatrix extent NZTM2000Quad', () => {
    const wmts = new WmtsCapabilities({ httpBase: 'https://basemaps.test', apiKey });
    const bigImagery = new Map();

    bigImagery.set(Imagery2193.id, {
      ...Imagery2193,
      bounds: {
        // These bounds are slightly outside the extent bounds of NZTM2000Quad (approx 0.3m offset)
        x: -3260586.9214,
        y: 419435.7552,
        width: 10018754.086099999,
        height: 10018754.086099999,
      },
    });

    wmts.fromParams({
      provider: Provider,
      tileMatrix: [Nztm2000QuadTms],
      tileSet: TileSetAerial,
      imagery: bigImagery,
      formats: ['png'],
    });
    const raw = wmts.toVNode();

    const wgs84 = raw.find('Contents', 'Layer', 'ows:WGS84BoundingBox');
    const crsBounds = raw.find('Contents', 'Layer', 'ows:BoundingBox');
    assert.equal(
      crsBounds?.find('ows:LowerCorner')?.toString(),
      `<ows:LowerCorner>419435.9938 -3260586.7284</ows:LowerCorner>`,
    );
    assert.equal(
      crsBounds?.find('ows:UpperCorner')?.toString(),
      `<ows:UpperCorner>10438190.1652 6758167.443</ows:UpperCorner>`,
    );

    assert.equal(wgs84?.find('ows:LowerCorner')?.toString(), '<ows:LowerCorner>-180 -49.929855</ows:LowerCorner>');
    assert.equal(wgs84?.find('ows:UpperCorner')?.toString(), '<ows:UpperCorner>180 2.938603</ows:UpperCorner>');
  });

  it('should include output the correct TileMatrix', () => {
    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      apiKey,
    });

    wmts.addTileMatrix(GoogleTms);
    for (const im of allImagery.values()) wmts.addImagery(im);
    wmts.addProvider(Provider);
    wmts.addTileSet(TileSetAerial);
    const raw = wmts.toVNode();

    const layer = raw.find('Contents', 'Layer');

    assert.equal(layer?.find('TileMatrixSetLink', 'TileMatrixSet')?.textContent, 'WebMercatorQuad');

    const matrix = tags(raw, 'TileMatrixSet')[1];
    const matrixId = raw?.find('Contents', 'TileMatrixSet', 'ows:Identifier') ?? null;
    assert.equal(matrix.find('ows:Identifier'), matrixId);
    assert.equal(matrixId?.textContent, 'WebMercatorQuad');

    assert.deepEqual(matrix.find('ows:SupportedCRS')?.textContent, 'urn:ogc:def:crs:EPSG::3857');
    assert.deepEqual(
      matrix.find('WellKnownScaleSet')?.textContent,
      'https://www.opengis.net/def/wkss/OGC/1.0/GoogleMapsCompatible',
    );

    const tileMatrices = Array.from(matrix.tags('TileMatrix'));

    assert.equal(tileMatrices.length, 25);

    function compareMatrix(x: VNodeElement, id: string, tileCount: number, scale: number): void {
      assert.equal(x.find('ows:Identifier')?.toString(), `<ows:Identifier>${id}</ows:Identifier>`);
      assert.equal(x.find('ScaleDenominator')?.toString(), `<ScaleDenominator>${scale}</ScaleDenominator>`);
      assert.equal(
        x.find('TopLeftCorner')?.toString(),
        `<TopLeftCorner>-20037508.3427892 20037508.3427892</TopLeftCorner>`,
      );
      assert.equal(x.find('TileWidth')?.toString(), `<TileWidth>256</TileWidth>`);
      assert.equal(x.find('TileHeight')?.toString(), `<TileHeight>256</TileHeight>`);
      assert.equal(x.find('MatrixWidth')?.toString(), `<MatrixWidth>${tileCount}</MatrixWidth>`);
      assert.equal(x.find('MatrixHeight')?.toString(), `<MatrixHeight>${tileCount}</MatrixHeight>`);
    }

    compareMatrix(tileMatrices[0], '0', 1, 559082264.028717);
    compareMatrix(tileMatrices[10], '10', 1024, 545978.773465544);
  });

  it('should output individual imagery adds', () => {
    const imagery = new Map<string, ConfigImagery>();
    imagery.set(Imagery3857.id, Imagery3857);
    imagery.set(Imagery2193.id, Imagery2193);

    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
    });

    wmts.fromParams({
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet: TileSetAerial,
      imagery,
      layers: TileSetAerial.layers,
      formats: ['png'],
    });

    const raw = wmts.toVNode();

    const tms = raw?.find('TileMatrixSet', 'ows:Identifier');

    assert.equal(tms?.textContent, 'WebMercatorQuad');

    const urls = Array.from(raw ? raw.tags('ResourceURL') : []);
    assert.equal(urls.length, 2);
    assert.deepEqual(
      urls[0].toString(),
      '<ResourceURL format="image/png" resourceType="tile" ' +
        'template="https://basemaps.test/v1/tiles/aerial/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png" />',
    );
    assert.deepEqual(
      urls[1].toString(),
      '<ResourceURL format="image/png" resourceType="tile" ' +
        'template="https://basemaps.test/v1/tiles/ōtorohanga-urban-2021-0.1m/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.png" />',
    );

    const layers = [...raw.tags('Layer')];

    assert.equal(layers.length, 2);
    assert.equal(layers[0].find('ows:Title')?.textContent, 'Aerial Imagery');

    assert.equal(layers[1].find('ows:Title')?.textContent, 'Ōtorohanga 0.1m Urban Aerial Photos (2021)');
    assert.equal(layers[1].find('ows:Identifier')?.textContent, 'ōtorohanga-urban-2021-0.1m');
    assert.equal(layers[1].find('ows:Keywords', 'ows:Keyword')?.textContent, 'Urban Aerial Photos');
  });

  it('should support multiple projections', () => {
    const imagery = new Map<string, ConfigImagery>();
    imagery.set(Imagery3857.id, Imagery3857);
    imagery.set(Imagery2193.id, Imagery2193);

    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
    });

    wmts.fromParams({
      provider: Provider,
      tileMatrix: [GoogleTms, Nztm2000QuadTms],
      tileSet: TileSetAerial,
      imagery: imagery,
      formats: ['png'],
    });

    const raw = wmts.toVNode();
    const layers = tags(raw, 'Layer');
    assert.equal(layers.length, 1);
    const layer = layers[0];

    // ensure order is valid
    assert.deepEqual(layer?.children.map((c) => (c instanceof VNodeElement ? c.tag : null)), [
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

    assert.equal(layer.find('ows:Title')?.textContent, 'Aerial Imagery');
    assert.equal(
      layer.find('ows:Keywords')?.toString(),
      '<ows:Keywords>\n  <ows:Keyword>Basemap</ows:Keyword>\n</ows:Keywords>',
    );
    assert.equal(layer.find('ows:Identifier')?.textContent, 'aerial');

    const adds = tags(layer, 'TileMatrixSet');

    assert.equal(adds.length, 2);
    assert.equal(adds[0].toString(), '<TileMatrixSet>WebMercatorQuad</TileMatrixSet>');
    assert.equal(adds[1].toString(), '<TileMatrixSet>NZTM2000Quad</TileMatrixSet>');

    const boundingBoxes = tags(layer, 'ows:BoundingBox');
    assert.equal(boundingBoxes.length, 2);
    assert.equal(boundingBoxes[0].attrs['crs'], 'urn:ogc:def:crs:EPSG::3857');
    assert.deepEqual(
      boundingBoxes[0].children.map((c) => c.textContent),
      ['19457809.9203 -4609458.5537', '19509787.0995 -4578883.7424'],
    );
    assert.equal(boundingBoxes[1].attrs['crs'], 'urn:ogc:def:crs:EPSG::2193');
    assert.deepEqual(
      boundingBoxes[1].children.map((c) => c.textContent),
      ['5766358.9964 1757351.3045', '5793264.8304 1798321.5516'],
    );

    const wgs84 = layer.find('ows:WGS84BoundingBox');
    assert.equal(wgs84?.attrs['crs'], 'urn:ogc:def:crs:OGC:2:84');
    assert.deepEqual(wgs84?.children.map((c) => c.textContent), ['174.79248 -38.212288', '175.259399 -37.996163']);
  });

  it('should only output imagery if exists', () => {
    const imagery = new Map<string, ConfigImagery>();
    const wmtsA = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
    });

    wmtsA.fromParams({
      provider: Provider,
      tileMatrix: [Nztm2000QuadTms],
      tileSet: TileSetAerial,
      imagery: imagery,
      formats: ['png'],
      layers: TileSetAerial.layers,
    });

    const rawA = wmtsA.toVNode();

    const layers = tags(rawA, 'Layer');
    assert.equal(layers.length, 1);

    imagery.set(Imagery3857.id, Imagery3857);
    const wmtsB = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
    });
    wmtsB.fromParams({
      provider: Provider,
      tileMatrix: [Nztm2000QuadTms],
      tileSet: TileSetAerial,
      imagery: imagery,
      formats: ['png'],
      layers: TileSetAerial.layers,
    });

    const rawB = wmtsB.toVNode();
    const layersB = tags(rawB, 'Layer');
    assert.equal(layersB.length, 1);
  });

  it('should cover the entire WebMercatorBounds', () => {
    const halfSize = GoogleTms.extent.width / 2;
    // Create two fake imagery adds one covers tile z1 x0 y0 another covers tile z1 x1 y1
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
      { 3857: imageTopLeft.id, name: 'a_top_left', title: 'A Top Left' },
      { 3857: imageBottomRight.id, name: 'b_bottom_right', title: 'B Bottom Right' },
    ];

    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
    });
    wmts.fromParams({
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet,
      imagery,
      formats: ['png'],
      layers: tileSet.layers,
    });

    const raw = wmts.toVNode();

    const boundingBox = tags(raw, 'ows:WGS84BoundingBox').map((c) =>
      c
        .toString()
        .split('\n')
        .map((c) => c.trim()),
    );
    assert.deepEqual(boundingBox[0][1], '<ows:LowerCorner>-180 -85.051129</ows:LowerCorner>');
    assert.equal(boundingBox[0][2], '<ows:UpperCorner>180 85.051129</ows:UpperCorner>');

    assert.deepEqual(boundingBox[1][1], '<ows:LowerCorner>-180 0</ows:LowerCorner>');
    assert.equal(boundingBox[1][2], '<ows:UpperCorner>0 85.051129</ows:UpperCorner>');

    assert.deepEqual(boundingBox[2][1], '<ows:LowerCorner>0 -85.051129</ows:LowerCorner>');
    assert.equal(boundingBox[2][2], '<ows:UpperCorner>180 0</ows:UpperCorner>');
  });

  it('should work when crossing anti meridian', () => {
    const halfSize = GoogleTms.extent.width / 2;

    const imagery = new Map();
    // This image covers z1 x1.5 y1 to z1 x0.5 y1
    // which cross the AM and covers half the width of two tiles
    const imageBottomRight = { ...Imagery3857, id: 'im_bottom_right', name: 'bottom_right' };
    imageBottomRight.bounds = { x: halfSize / 2, y: -halfSize, width: halfSize, height: halfSize };
    imagery.set(imageBottomRight.id, imageBottomRight);

    const tileSet = { ...TileSetAerial };
    tileSet.layers = [{ 3857: imageBottomRight.id, name: 'b_bottom_right', title: 'B Bottom Right' }];

    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
    });
    wmts.fromParams({
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet,
      imagery,
      formats: ['png'],
      layers: tileSet.layers,
    });

    const raw = wmts.toVNode();

    const boundingBox = tags(raw, 'ows:WGS84BoundingBox').map((c) =>
      roundNumbersInString(c.toString(), 4)
        .split('\n')
        .map((c) => c.trim()),
    );

    assert.deepEqual(boundingBox[0][1], '<ows:LowerCorner>-180 -85.0511</ows:LowerCorner>');
    assert.equal(boundingBox[0][2], '<ows:UpperCorner>180 85.0511</ows:UpperCorner>');

    assert.deepEqual(boundingBox[1][1], '<ows:LowerCorner>-180 -85.0511</ows:LowerCorner>');
    assert.equal(boundingBox[1][2], '<ows:UpperCorner>180 85.0511</ows:UpperCorner>');
  });

  it('should work with NZTM2000Quad', () => {
    const wmts = new WmtsCapabilities({ tileMatrix: [] } as any);

    // Full NZTM200Quad coverage
    const bbox = wmts.buildWgs84BoundingBox(Nztm2000QuadTms, []);
    assert.equal(bbox.children[0].textContent, '-180 -49.929855');
    assert.equal(bbox.children[1].textContent, '180 2.938603');

    // Full NZTM200Quad coverage at z1
    const bboxB = wmts.buildWgs84BoundingBox(Nztm2000QuadTms, [
      Nztm2000QuadTms.tileToSourceBounds({ z: 1, x: 0, y: 0 }),
      Nztm2000QuadTms.tileToSourceBounds({ z: 1, x: 1, y: 1 }),
    ]);
    assert.equal(bboxB.children[0].textContent, '-180 -49.929855');
    assert.equal(bboxB.children[1].textContent, '180 2.938603');

    // Full NZTM200Quad coverage at z5
    const tileCount = Nztm2000QuadTms.zooms[5].matrixWidth;
    const bboxC = wmts.buildWgs84BoundingBox(Nztm2000QuadTms, [
      Nztm2000QuadTms.tileToSourceBounds({ z: 5, x: 0, y: 0 }),
      Nztm2000QuadTms.tileToSourceBounds({ z: 5, x: tileCount - 1, y: tileCount - 1 }),
    ]);
    assert.equal(bboxC.children[0].textContent, '-180 -49.929855');
    assert.equal(bboxC.children[1].textContent, '180 2.938603');
  });
});

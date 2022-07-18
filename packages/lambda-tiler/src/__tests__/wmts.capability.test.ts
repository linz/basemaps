import { ConfigImagery, ConfigTileSetRaster, TileSetType } from '@basemaps/config';
import { GoogleTms, ImageFormat, Nztm2000QuadTms } from '@basemaps/geo';
import { V, VNodeElement } from '@basemaps/shared';
import { roundNumbersInString } from '@basemaps/test/build/rounding.js';
import o from 'ospec';
import { WmtsCapabilities } from '../wmts.capability.js';
import { Provider } from './xyz.util.js';

function tags(node: VNodeElement | null | undefined, tag: string): VNodeElement[] {
  if (node == null) return [];
  return [...node.tags(tag)];
}
function listTag(node: VNodeElement | null | undefined, tag: string): string[] {
  return tags(node, tag).map((n) => n.toString());
}

o.spec('WmtsCapabilities', () => {
  const apiKey = 'secret1234';

  const tileSetAerial: ConfigTileSetRaster = {
    id: 'ts_aerial',
    name: 'aerial',
    type: TileSetType.Raster,
    format: ImageFormat.Webp,
    description: 'aerial__description',
    title: 'Aerial Imagery',
    category: 'Basemap',
    layers: [
      {
        2193: 'im_01FYWKAJ86W9P7RWM1VB62KD0H',
        3857: 'im_01FYWKATAEK2ZTJQ2PX44Y0XNT',
        title: 'Ōtorohanga 0.1m Urban Aerial Photos (2021)',
        category: 'Urban Aerial Photos',
        name: 'ōtorohanga_urban_2021_0-1m_RGB',
      },
    ],
  };
  const imagery2193: ConfigImagery = {
    id: 'im_01FYWKAJ86W9P7RWM1VB62KD0H',
    name: 'ōtorohanga_urban_2021_0-1m_RGB',
    title: 'Ōtorohanga 0.1m Urban Aerial Photos (2021)',
    category: 'Urban Aerial Photos',
    projection: 2193,
    tileMatrix: 'NZTM2000Quad',
    uri: 's3://linz-basemaps/2193/ōtorohanga_urban_2021_0-1m_RGB/01FYWKAJ86W9P7RWM1VB62KD0H',
    bounds: {
      x: 1757351.3044652338,
      y: 5766358.996410044,
      width: 40970.247160854284,
      height: 26905.833956381306,
    },
    files: [],
  };
  const imagery3857: ConfigImagery = {
    id: 'im_01FYWKATAEK2ZTJQ2PX44Y0XNT',
    name: 'ōtorohanga_urban_2021_0-1m_RGB',
    title: 'Ōtorohanga 0.1m Urban Aerial Photos (2021)',
    category: 'Urban Aerial Photos',
    projection: 3857,
    tileMatrix: 'WebMercatorQuad',
    uri: 's3://linz-basemaps/3857/ōtorohanga_urban_2021_0-1m_RGB/01FYWKATAEK2ZTJQ2PX44Y0XNT',
    bounds: {
      x: 19457809.920274343,
      y: -4609458.55370921,
      width: 51977.179234057665,
      height: 30574.81131407339,
    },
    files: [],
  };
  const allImagery = new Map();
  allImagery.set(imagery2193.id, imagery2193);
  allImagery.set(imagery3857.id, imagery3857);

  o('should output the requested formats', () => {
    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet: tileSetAerial,
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
      tileSet: tileSetAerial,
      imagery: allImagery,
      apiKey,
      formats: [ImageFormat.Avif],
      isIndividualLayers: false,
    }).toXml();

    o(xml.split('\n')[0]).deepEquals('<?xml version="1.0" encoding="utf-8"?>');
  });

  o('should support unicorns and rainbows', () => {
    const tileSet = { ...tileSetAerial };
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

  o('should build capability xml for tileset and projection', () => {
    const imagery = new Map();
    imagery.set(imagery3857.id, imagery3857);
    const wmts = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet: tileSetAerial,
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
      tileSet: tileSetAerial,
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
    imagery.set(imagery3857.id, imagery3857);
    imagery.set(imagery2193.id, imagery2193);
    const raw = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms],
      tileSet: tileSetAerial,
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
    imagery.set(imagery3857.id, imagery3857);
    imagery.set(imagery2193.id, imagery2193);
    const raw = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [GoogleTms, Nztm2000QuadTms],
      tileSet: tileSetAerial,
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
      tileSet: tileSetAerial,
      imagery: imagery,
      formats: [ImageFormat.Png],
      isIndividualLayers: true,
    }).toVNode();

    const layers = tags(raw, 'Layer');
    o(layers.length).equals(1);

    imagery.set(imagery3857.id, imagery3857);
    const rawB = new WmtsCapabilities({
      httpBase: 'https://basemaps.test',
      provider: Provider,
      tileMatrix: [Nztm2000QuadTms],
      tileSet: tileSetAerial,
      imagery: imagery,
      formats: [ImageFormat.Png],
      isIndividualLayers: true,
    }).toVNode();

    const layersB = tags(rawB, 'Layer');
    o(layersB.length).equals(1);
  });
});

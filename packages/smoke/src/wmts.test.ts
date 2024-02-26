import assert from 'node:assert';
import { test } from 'node:test';

import { ctx } from './base.js';

test(`GET /v1/tiles/aerial/WebMercatorQuad/WMTSCapabilities.xml`, async () => {
  const res = await ctx.req(`/v1/tiles/aerial/WebMercatorQuad/WMTSCapabilities.xml?api=${ctx.apiKey}`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), `text/xml`);

  const body = await res.text();

  const xml = body
    .split('\n')
    .map((c) => c.trim())
    .join('');

  assert.ok(xml.includes('<ows:Identifier>WebMercatorQuad</ows:Identifier>'));
  assert.ok(xml.includes('<TileMatrixSet>WebMercatorQuad</TileMatrixSet>'));
  assert.ok(!xml.includes('<ows:Identifier>NZTM2000Quad</ows:Identifier>'));
  assert.ok(!xml.includes('<TileMatrixSet>NZTM2000Quad</TileMatrixSet>'));

  assert.ok(
    xml.includes(
      '<WellKnownScaleSet>https://www.opengis.net/def/wkss/OGC/1.0/GoogleMapsCompatible</WellKnownScaleSet>',
    ),
  );

  assert.ok(
    xml.includes(
      `<ows:BoundingBox crs="urn:ogc:def:crs:EPSG::3857"><ows:LowerCorner>-20037508.3428 -20037508.3428</ows:LowerCorner><ows:UpperCorner>20037508.3428 20037508.3428</ows:UpperCorner></ows:BoundingBox>`,
    ),
  );

  assert.ok(
    xml.includes(
      `<ows:WGS84BoundingBox crs="urn:ogc:def:crs:OGC:2:84"><ows:LowerCorner>-180 -85.051129</ows:LowerCorner><ows:UpperCorner>180 85.051129</ows:UpperCorner></ows:WGS84BoundingBox>`,
    ),
  );

  assert.ok(xml.includes('<ows:Title>Aerial Imagery Basemap</ows:Title>'));
});

test(`GET /v1/tiles/aerial/NZTM2000Quad/WMTSCapabilities.xml`, async () => {
  const res = await ctx.req(`/v1/tiles/aerial/NZTM2000Quad/WMTSCapabilities.xml?api=${ctx.apiKey}`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), `text/xml`);

  const body = await res.text();

  const xml = body
    .split('\n')
    .map((c) => c.trim())
    .join('');

  assert.ok(!xml.includes('<ows:Identifier>WebMercatorQuad</ows:Identifier>'));
  assert.ok(xml.includes('<ows:Identifier>NZTM2000Quad</ows:Identifier>'));
  assert.ok(xml.includes('<TileMatrixSet>NZTM2000Quad</TileMatrixSet>'));

  assert.ok(xml.includes(ctx.apiKey));
  assert.ok(
    xml.includes(
      [
        `<ows:BoundingBox crs="urn:ogc:def:crs:EPSG::2193">`,
        `<ows:LowerCorner>419435.9938 -3260586.7284</ows:LowerCorner>`,
        `<ows:UpperCorner>10438190.1652 6758167.443</ows:UpperCorner>`,
        `</ows:BoundingBox>`,
      ].join(''),
    ),
  );

  assert.ok(
    xml.includes(
      [
        `<ows:WGS84BoundingBox crs="urn:ogc:def:crs:OGC:2:84">`,
        `<ows:LowerCorner>-180 -49.929855</ows:LowerCorner>`,
        `<ows:UpperCorner>180 2.938603</ows:UpperCorner>`,
        `</ows:WGS84BoundingBox>`,
      ].join(''),
    ),
  );

  assert.ok(xml.includes('<ows:Title>Aerial Imagery Basemap</ows:Title>'));
});

test(`GET /v1/tiles/ōtorohanga-urban-2021-0.1m/WMTSCapabilities.xml`, async () => {
  const res = await ctx.req(`/v1/tiles/ōtorohanga-urban-2021-0.1m/WMTSCapabilities.xml?api=${ctx.apiKey}&format=webp`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), `text/xml`);

  const body = await res.text();

  const xml = body
    .split('\n')
    .map((c) => c.trim())
    .join('');

  assert.ok(xml.includes('<ows:Identifier>WebMercatorQuad</ows:Identifier>'));
  assert.ok(xml.includes('<TileMatrixSet>WebMercatorQuad</TileMatrixSet>'));
  assert.ok(xml.includes('<ows:Identifier>NZTM2000Quad</ows:Identifier>'));
  assert.ok(xml.includes('<TileMatrixSet>NZTM2000Quad</TileMatrixSet>'));

  assert.ok(xml.includes(ctx.apiKey));
  assert.ok(xml.includes('<ows:Title>Ōtorohanga 0.1m Urban Aerial Photos (2021)</ows:Title>'));
  // should not include png or jpeg
  assert.ok(!xml.includes('format="image/png"'));
  assert.ok(!xml.includes('format="image/jpeg"'));

  // should include webp
  assert.ok(xml.includes('format="image/webp"'));

  const basePath = new URL('/v1/tiles', ctx.host).href;

  const templateUrl = `${basePath}/ōtorohanga-urban-2021-0.1m/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.webp`;
  assert.ok(xml.includes(templateUrl), templateUrl);
});

test(`GET /v1/tiles/aerial/WMTSCapabilities.xml`, async () => {
  const res = await ctx.req(`/v1/tiles/aerial/WMTSCapabilities.xml?api=${ctx.apiKey}`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), `text/xml`);

  const body = await res.text();

  const xml = body
    .split('\n')
    .map((c) => c.trim())
    .join('');

  assert.ok(xml.includes('<ows:Identifier>WebMercatorQuad</ows:Identifier>'));
  assert.ok(xml.includes('<TileMatrixSet>WebMercatorQuad</TileMatrixSet>'));
  assert.ok(xml.includes('<ows:Identifier>NZTM2000Quad</ows:Identifier>'));
  assert.ok(xml.includes('<TileMatrixSet>NZTM2000Quad</TileMatrixSet>'));

  assert.ok(xml.includes(ctx.apiKey));

  assert.ok(xml.includes('<ows:Title>Aerial Imagery Basemap</ows:Title>'));
  assert.ok(xml.includes('<ows:Title>Ōtorohanga 0.1m Urban Aerial Photos (2021)</ows:Title>'));

  const layers = xml.match(/<Layer>/g) ?? [];
  assert.ok(layers.length > 20); // should have a ton of layers
});

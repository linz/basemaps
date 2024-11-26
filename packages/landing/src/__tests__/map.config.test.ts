import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { GoogleTms, Nztm2000QuadTms, Nztm2000Tms } from '@basemaps/geo';

import { Config } from '../config.js';
import { MapConfig } from '../config.map.js';
import { MapOptionType, WindowUrl } from '../url.js';

declare const global: {
  window?: { location: { origin: string } };
};

describe('WindowUrl', () => {
  const mc = new MapConfig();
  beforeEach(() => {
    global.window = { location: { origin: 'https://basemaps.linz.govt.nz' } };
  });
  afterEach(() => {
    delete global.window;
  });

  it('should extract default information', () => {
    mc.updateFromUrl('');
    assert.equal(mc.tileMatrix, GoogleTms);
    assert.equal(mc.layerId, 'aerial');
    assert.equal(mc.style, null);
    assert.equal(mc.isDebug, false);
    assert.equal(mc.config, null);
  });

  it('should support "tileMatrix"', () => {
    mc.updateFromUrl('?tileMatrix=nztm2000quad');
    assert.equal(mc.tileMatrix, Nztm2000QuadTms);
  });

  it('should support config locations', () => {
    mc.updateFromUrl('?config=s3://linz-basemaps/config/bar.json');
    assert.equal(mc.config, 's3://linz-basemaps/config/bar.json');
  });

  it('should support vector tiles', () => {
    mc.updateFromUrl('?i=topographic');
    assert.equal(mc.tileMatrix, GoogleTms);
    assert.equal(mc.layerId, 'topographic');
    assert.equal(mc.style, 'topographic');
    assert.equal(mc.isDebug, false);
  });

  it('should support NZTM tiles', () => {
    mc.updateFromUrl('?p=2193');
    assert.equal(mc.tileMatrix, Nztm2000QuadTms);
    assert.equal(mc.layerId, 'aerial');
    assert.equal(mc.style, null);
    assert.equal(mc.isDebug, false);
  });

  it('should support basic', () => {
    mc.updateFromUrl('?i=abc123&s=basic&p=2193&d=true&debug');
    assert.equal(mc.tileMatrix, Nztm2000QuadTms);
    assert.equal(mc.layerId, 'abc123');
    assert.equal(mc.style, 'basic');
    assert.equal(mc.isDebug, true);
  });

  it('should extract tile matrix information', () => {
    mc.updateFromUrl('?i=abc123&p=nztm2000&d=true&debug=yes');
    assert.equal(mc.tileMatrix, Nztm2000QuadTms);
    mc.updateFromUrl('?i=abc123&p=nztm2000quad&d=true&debug=yes');
    assert.equal(mc.tileMatrix, Nztm2000QuadTms);
    mc.updateFromUrl('?i=abc123&s=basic&p=NZTM2000Quad&d=true&debug=yes');
    assert.equal(mc.tileMatrix, Nztm2000QuadTms);
  });

  it('should convert to a url', () => {
    const apiKey = Config.ApiKey;
    mc.updateFromUrl('');

    assert.equal(
      mc.toTileUrl(MapOptionType.TileRaster),
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.png?api=${apiKey}`,
    );
    assert.equal(
      mc.toTileUrl(MapOptionType.Wmts),
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/WMTSCapabilities.xml?api=${apiKey}`,
    );
    assert.equal(
      mc.toTileUrl(MapOptionType.TileWmts),
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{TileMatrix}/{TileCol}/{TileRow}.png?api=${apiKey}`,
    );
  });

  it('should use default epsg codes for urls', () => {
    const apiKey = Config.ApiKey;
    mc.updateFromUrl('');

    assert.equal(
      mc.toTileUrl(MapOptionType.TileRaster),
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.png?api=${apiKey}`,
    );
    mc.tileMatrix = Nztm2000Tms;
    assert.equal(
      mc.toTileUrl(MapOptionType.TileRaster),
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/NZTM2000/{z}/{x}/{y}.png?api=${apiKey}`,
    );
    mc.tileMatrix = Nztm2000QuadTms;
    assert.equal(
      mc.toTileUrl(MapOptionType.TileRaster),
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/NZTM2000Quad/{z}/{x}/{y}.png?api=${apiKey}`,
    );
  });

  it('should convert to a url with baseUrl', () => {
    const apiKey = Config.ApiKey;
    mc.updateFromUrl('');

    process.env['TILE_HOST'] = 'https://foo.bar.com';
    assert.equal(
      mc.toTileUrl(MapOptionType.TileRaster),
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.png?api=${apiKey}`,
    );
    assert.equal(
      mc.toTileUrl(MapOptionType.Wmts),
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/WMTSCapabilities.xml?api=${apiKey}`,
    );
    assert.equal(
      mc.toTileUrl(MapOptionType.TileWmts),
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/{TileMatrix}/{TileCol}/{TileRow}.png?api=${apiKey}`,
    );

    WindowUrl.ImageFormat = 'webp';
    assert.equal(
      mc.toTileUrl(MapOptionType.TileWmts),
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/{TileMatrix}/{TileCol}/{TileRow}.webp?api=${apiKey}`,
    );
    WindowUrl.ImageFormat = 'png';
    delete process.env['TILE_HOST'];
  });

  it('should include config in all requests', () => {
    const apiKey = Config.ApiKey;

    mc.updateFromUrl('?config=s3://linz-basemaps/config.json');
    process.env['TILE_HOST'] = 'https://foo.bar.com';

    assert.equal(
      mc.toTileUrl(MapOptionType.TileRaster),
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.png?api=${apiKey}&config=Q5pC4UjWdtFLU1CYtLcRSmB49RekgDgMa5EGJnB2M`,
    );
    assert.equal(
      mc.toTileUrl(MapOptionType.TileVectorXyz),
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.pbf?api=${apiKey}&config=Q5pC4UjWdtFLU1CYtLcRSmB49RekgDgMa5EGJnB2M`,
    );
    assert.equal(
      mc.toTileUrl(MapOptionType.Attribution),
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/attribution.json?api=${apiKey}&config=Q5pC4UjWdtFLU1CYtLcRSmB49RekgDgMa5EGJnB2M`,
    );
    assert.equal(
      mc.toTileUrl(MapOptionType.Wmts),
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/WMTSCapabilities.xml?api=${apiKey}&config=Q5pC4UjWdtFLU1CYtLcRSmB49RekgDgMa5EGJnB2M`,
    );

    WindowUrl.ImageFormat = 'png';
    assert.equal(
      mc.toTileUrl(MapOptionType.Style),
      `https://foo.bar.com/v1/styles/aerial.json?api=${apiKey}&config=Q5pC4UjWdtFLU1CYtLcRSmB49RekgDgMa5EGJnB2M&format=png`,
    );
  });

  it('should remove im_ prefix from imagery', () => {
    mc.updateFromUrl('i=im_01EDA2YFXH2JN264VG1HKBT625');
    assert.equal(mc.layerId, '01EDA2YFXH2JN264VG1HKBT625');

    mc.updateFromUrl('i=01EDA2YFXH2JN264VG1HKBT625');
    assert.equal(mc.layerId, '01EDA2YFXH2JN264VG1HKBT625');
  });

  it('should enable labels by default', () => {
    // aerial layer & debug disabled
    mc.updateFromUrl('');
    assert.equal(mc.layerId, 'aerial');
    assert.equal(mc.isDebug, false);
    assert.equal(mc.labels, true);

    // aerial layer, labels enabled & debug disabled
    mc.updateFromUrl('?labels=true');
    assert.equal(mc.layerId, 'aerial');
    assert.equal(mc.isDebug, false);
    assert.equal(mc.labels, true);
  });

  it('should not enable labels by default', () => {
    // aerial layer, but labels disabled
    mc.updateFromUrl('?labels=false');
    assert.equal(mc.layerId, 'aerial');
    assert.equal(mc.isDebug, false);
    assert.equal(mc.labels, false);

    // aerial layer, but debug enabled
    mc.updateFromUrl('?debug');
    assert.equal(mc.layerId, 'aerial');
    assert.equal(mc.isDebug, true);
    assert.equal(mc.labels, false);

    // aerial layer, labels disabled & debug enabled
    mc.updateFromUrl('?labels=false&debug');
    assert.equal(mc.layerId, 'aerial');
    assert.equal(mc.isDebug, true);
    assert.equal(mc.labels, false);

    // debug disabled, but individual layer
    mc.updateFromUrl('i=abc123');
    assert.equal(mc.layerId, 'abc123');
    assert.equal(mc.isDebug, false);
    assert.equal(mc.labels, false);

    // individual layer & debug enabled
    mc.updateFromUrl('i=abc123&debug');
    assert.equal(mc.layerId, 'abc123');
    assert.equal(mc.isDebug, true);
    assert.equal(mc.labels, false);
  });
});

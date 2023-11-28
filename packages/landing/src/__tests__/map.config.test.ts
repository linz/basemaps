import { GoogleTms, Nztm2000QuadTms, Nztm2000Tms } from '@basemaps/geo';
import o from 'ospec';

import { Config } from '../config.js';
import { MapConfig } from '../config.map.js';
import { MapOptionType, WindowUrl } from '../url.js';

declare const global: {
  window?: { location: { origin: string } };
};

o.spec('WindowUrl', () => {
  const mc = new MapConfig();
  o.beforeEach(() => {
    global.window = { location: { origin: 'https://basemaps.linz.govt.nz' } };
  });
  o.afterEach(() => {
    delete global.window;
  });

  o('should extract default information', () => {
    mc.updateFromUrl('');
    o(mc.tileMatrix).equals(GoogleTms);
    o(mc.layerId).equals('aerial');
    o(mc.style).equals(null);
    o(mc.isDebug).equals(false);
    o(mc.config).equals(null);
  });

  o('should support "tileMatrix"', () => {
    mc.updateFromUrl('?tileMatrix=nztm2000quad');
    o(mc.tileMatrix).equals(Nztm2000QuadTms);
  });

  o('should support config locations', () => {
    mc.updateFromUrl('?config=s3://linz-basemaps/config/bar.json');
    o(mc.config).equals('s3://linz-basemaps/config/bar.json');
  });

  o('should support vector tiles', () => {
    mc.updateFromUrl('?i=topographic');
    o(mc.tileMatrix).equals(GoogleTms);
    o(mc.layerId).equals('topographic');
    o(mc.style).equals('topographic');
    o(mc.isDebug).equals(false);
  });

  o('should support NZTM tiles', () => {
    mc.updateFromUrl('?p=2193');
    o(mc.tileMatrix).equals(Nztm2000QuadTms);
    o(mc.layerId).equals('aerial');
    o(mc.style).equals(null);
    o(mc.isDebug).equals(false);
  });

  o('should support basic', () => {
    mc.updateFromUrl('?i=abc123&s=basic&p=2193&d=true&debug');
    o(mc.tileMatrix).equals(Nztm2000QuadTms);
    o(mc.layerId).equals('abc123');
    o(mc.style).equals('basic');
    o(mc.isDebug).equals(true);
  });

  o('should extract tile matrix information', () => {
    mc.updateFromUrl('?i=abc123&p=nztm2000&d=true&debug=yes');
    o(mc.tileMatrix).equals(Nztm2000QuadTms);
    mc.updateFromUrl('?i=abc123&p=nztm2000quad&d=true&debug=yes');
    o(mc.tileMatrix).equals(Nztm2000QuadTms);
    mc.updateFromUrl('?i=abc123&s=basic&p=NZTM2000Quad&d=true&debug=yes');
    o(mc.tileMatrix).equals(Nztm2000QuadTms);
  });

  o('should extract dateRange', () => {
    mc.updateFromUrl('?i=abc123&p=nztm2000&d=true&debug=yes&date[before]=1975-12-31T23:59:59.999Z');
    o(mc.filter.date.before).equals('1975-12-31T23:59:59.999Z');
    mc.updateFromUrl('?date[after]=1952-01-01T00:00:00.000Z&date[before]=1975-12-31T23:59:59.999Z');
    o(mc.filter.date.before).equals('1975-12-31T23:59:59.999Z');
    mc.updateFromUrl('?date%5Bafter%5D=1952-01-01T00%3A00%3A00.000Z&date%5Bbefore%5D=1975-12-31T23%3A59%3A59.999Z');
    o(mc.filter.date.before).equals('1975-12-31T23:59:59.999Z');
  });

  o('should resolve the invalid dateRange', () => {
    mc.updateFromUrl('?i=abc123&p=nztm2000&d=true&debug=yes&date[before]=1949-12-31T23:59:59.999Z');
    o(mc.filter.date.before).equals(undefined);
    mc.updateFromUrl('?date[before]=2099-12-31T23:59:59.999Z');
    o(mc.filter.date.before).equals(undefined);
  });

  o('should convert to a url', () => {
    const apiKey = Config.ApiKey;
    mc.updateFromUrl('');

    o(mc.toTileUrl(MapOptionType.TileRaster)).equals(
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.png?api=${apiKey}`,
    );
    o(mc.toTileUrl(MapOptionType.Wmts)).equals(
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/WMTSCapabilities.xml?api=${apiKey}`,
    );
    o(mc.toTileUrl(MapOptionType.TileWmts)).equals(
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{TileMatrix}/{TileCol}/{TileRow}.png?api=${apiKey}`,
    );
  });

  o('should use default epsg codes for urls', () => {
    const apiKey = Config.ApiKey;
    mc.updateFromUrl('');

    o(mc.toTileUrl(MapOptionType.TileRaster)).equals(
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.png?api=${apiKey}`,
    );
    mc.tileMatrix = Nztm2000Tms;
    o(mc.toTileUrl(MapOptionType.TileRaster)).equals(
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/NZTM2000/{z}/{x}/{y}.png?api=${apiKey}`,
    );
    mc.tileMatrix = Nztm2000QuadTms;
    o(mc.toTileUrl(MapOptionType.TileRaster)).equals(
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/NZTM2000Quad/{z}/{x}/{y}.png?api=${apiKey}`,
    );
  });

  o('should convert to a url with baseUrl', () => {
    const apiKey = Config.ApiKey;
    mc.updateFromUrl('');

    process.env.TILE_HOST = 'https://foo.bar.com';
    o(mc.toTileUrl(MapOptionType.TileRaster)).equals(
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.png?api=${apiKey}`,
    );
    o(mc.toTileUrl(MapOptionType.Wmts)).equals(
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/WMTSCapabilities.xml?api=${apiKey}`,
    );
    o(mc.toTileUrl(MapOptionType.TileWmts)).equals(
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/{TileMatrix}/{TileCol}/{TileRow}.png?api=${apiKey}`,
    );

    WindowUrl.ImageFormat = 'webp';
    o(mc.toTileUrl(MapOptionType.TileWmts)).equals(
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/{TileMatrix}/{TileCol}/{TileRow}.webp?api=${apiKey}`,
    );
    WindowUrl.ImageFormat = 'png';
    delete process.env.TILE_HOST;
  });

  o('should include config in all requests', () => {
    const apiKey = Config.ApiKey;

    mc.updateFromUrl('?config=s3://linz-basemaps/config.json');
    process.env.TILE_HOST = 'https://foo.bar.com';

    o(mc.toTileUrl(MapOptionType.TileRaster)).equals(
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.png?api=${apiKey}&config=Q5pC4UjWdtFLU1CYtLcRSmB49RekgDgMa5EGJnB2M`,
    );
    o(mc.toTileUrl(MapOptionType.TileVectorXyz)).equals(
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/{z}/{x}/{y}.pbf?api=${apiKey}&config=Q5pC4UjWdtFLU1CYtLcRSmB49RekgDgMa5EGJnB2M`,
    );
    o(mc.toTileUrl(MapOptionType.Attribution)).equals(
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/attribution.json?api=${apiKey}&config=Q5pC4UjWdtFLU1CYtLcRSmB49RekgDgMa5EGJnB2M`,
    );
    o(mc.toTileUrl(MapOptionType.Wmts)).equals(
      `https://foo.bar.com/v1/tiles/aerial/WebMercatorQuad/WMTSCapabilities.xml?api=${apiKey}&config=Q5pC4UjWdtFLU1CYtLcRSmB49RekgDgMa5EGJnB2M`,
    );

    WindowUrl.ImageFormat = 'png';
    o(mc.toTileUrl(MapOptionType.Style)).equals(
      `https://foo.bar.com/v1/styles/aerial.json?api=${apiKey}&config=Q5pC4UjWdtFLU1CYtLcRSmB49RekgDgMa5EGJnB2M&format=png`,
    );
  });

  o('should remove im_ prefix from imagery', () => {
    mc.updateFromUrl('i=im_01EDA2YFXH2JN264VG1HKBT625');
    o(mc.layerId).equals('01EDA2YFXH2JN264VG1HKBT625');

    mc.updateFromUrl('i=01EDA2YFXH2JN264VG1HKBT625');
    o(mc.layerId).equals('01EDA2YFXH2JN264VG1HKBT625');
  });
});

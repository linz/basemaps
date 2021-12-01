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
  const googleLoc = { lat: 174.7763921, lon: -41.277848, zoom: 8 };

  o.spec('Hash', () => {
    o('should encode lon lat', () => {
      const output = WindowUrl.toHash(googleLoc);
      o(output).equals('#@174.7763921,-41.2778480,z8');
      o(WindowUrl.fromHash(output)).deepEquals(googleLoc);
      o(WindowUrl.fromHash('#@174.7763921,-41.2778480,8z')).deepEquals(googleLoc);
    });

    o('should encode fractional zooms', () => {
      o(WindowUrl.fromHash('#@174.7763921,-41.2778480,14.25z').zoom).deepEquals(14.25);
      o(WindowUrl.fromHash('#@174.7763921,-41.2778480,z14.25').zoom).deepEquals(14.25);
    });

    o('should not fail if parts are missing', () => {
      const missingZoom = WindowUrl.fromHash('#@174.7763921,-41.2778480,');
      o(missingZoom).deepEquals({ lat: googleLoc.lat, lon: googleLoc.lon });
      const missingParam = WindowUrl.fromHash('#@174.7763921,');
      o(missingParam).deepEquals({});
    });
  });

  o('should extract default information', () => {
    mc.updateFromUrl('');
    o(mc.tileMatrix).equals(GoogleTms);
    o(mc.layerId).equals('aerial');
    o(mc.style).equals(null);
    o(mc.debug).equals(false);
  });

  o('should support vector tiles', () => {
    mc.updateFromUrl('?i=topographic');
    o(mc.tileMatrix).equals(GoogleTms);
    o(mc.layerId).equals('topographic');
    o(mc.style).equals('topographic');
    o(mc.debug).equals(false);
  });

  o('should support NZTM tiles', () => {
    mc.updateFromUrl('?p=2193');
    o(mc.tileMatrix).equals(Nztm2000QuadTms);
    o(mc.layerId).equals('aerial');
    o(mc.style).equals(null);
    o(mc.debug).equals(false);
  });

  o('should support ', () => {
    mc.updateFromUrl('?i=abc123&s=basic&p=2193&d=true&debug=yes');
    o(mc.tileMatrix).equals(Nztm2000QuadTms);
    o(mc.layerId).equals('abc123');
    o(mc.style).equals('basic');
    o(mc.debug).equals(true);
  });

  o('should extract tile matrix information', () => {
    mc.updateFromUrl('?i=abc123&p=nztm2000&d=true&debug=yes');
    o(mc.tileMatrix).equals(Nztm2000QuadTms);
    mc.updateFromUrl('?i=abc123&p=nztm2000quad&d=true&debug=yes');
    o(mc.tileMatrix).equals(Nztm2000QuadTms);
    mc.updateFromUrl('?i=abc123&s=basic&p=NZTM2000Quad&d=true&debug=yes');
    o(mc.tileMatrix).equals(Nztm2000QuadTms);
  });

  o('should convert to a url', () => {
    const apiKey = Config.ApiKey;
    mc.updateFromUrl('');

    o(mc.toTileUrl(MapOptionType.TileRaster)).equals(
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.png?api=${apiKey}`,
    );
    o(mc.toTileUrl(MapOptionType.Wmts)).equals(
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/WMTSCapabilities.xml?api=${apiKey}`,
    );
    o(mc.toTileUrl(MapOptionType.TileWmts)).equals(
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/{TileMatrix}/{TileCol}/{TileRow}.png?api=${apiKey}`,
    );
  });

  o('should use default epsg codes for urls', () => {
    const apiKey = Config.ApiKey;
    mc.updateFromUrl('');

    o(mc.toTileUrl(MapOptionType.TileRaster)).equals(
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.png?api=${apiKey}`,
    );
    mc.tileMatrix = Nztm2000Tms;
    o(mc.toTileUrl(MapOptionType.TileRaster)).equals(
      `https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:2193/{z}/{x}/{y}.png?api=${apiKey}`,
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
      `https://foo.bar.com/v1/tiles/aerial/EPSG:3857/{z}/{x}/{y}.png?api=${apiKey}`,
    );
    o(mc.toTileUrl(MapOptionType.Wmts)).equals(
      `https://foo.bar.com/v1/tiles/aerial/EPSG:3857/WMTSCapabilities.xml?api=${apiKey}`,
    );
    o(mc.toTileUrl(MapOptionType.TileWmts)).equals(
      `https://foo.bar.com/v1/tiles/aerial/EPSG:3857/{TileMatrix}/{TileCol}/{TileRow}.png?api=${apiKey}`,
    );

    WindowUrl.ImageFormat = 'webp';
    o(mc.toTileUrl(MapOptionType.TileWmts)).equals(
      `https://foo.bar.com/v1/tiles/aerial/EPSG:3857/{TileMatrix}/{TileCol}/{TileRow}.webp?api=${apiKey}`,
    );
    WindowUrl.ImageFormat = 'png';
    delete process.env.TILE_HOST;
  });

  o('should remove im_ prefix from imagery', () => {
    mc.updateFromUrl('i=im_01EDA2YFXH2JN264VG1HKBT625');
    o(mc.layerId).equals('01EDA2YFXH2JN264VG1HKBT625');

    mc.updateFromUrl('i=01EDA2YFXH2JN264VG1HKBT625');
    o(mc.layerId).equals('01EDA2YFXH2JN264VG1HKBT625');
  });
});

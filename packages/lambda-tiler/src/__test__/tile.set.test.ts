import { GoogleTms, Nztm2000Tms } from '@basemaps/geo';
import o from 'ospec';
import { TileSetRaster } from '../tile.set.raster.js';

o.spec('tile.set', () => {
  o('extent', () => {
    o(new TileSetRaster('google', GoogleTms).extent.toBbox()).deepEquals([
      -20037508.3427892, -20037508.3427892, 20037508.3427892, 20037508.3427892,
    ]);
    o(new TileSetRaster('nztm', Nztm2000Tms).extent.toBbox()).deepEquals([274000, 3087000, 3327000, 7173000]);
  });
});

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Approx } from '@basemaps/test';
import { round } from '@basemaps/test/build/rounding.js';

import { Point } from '../bounds.js';
import { Epsg } from '../epsg.js';
import { QuadKey } from '../quad.key.js';
import { TileMatrixSet } from '../tile.matrix.set.js';
import { GoogleTms } from '../tms/google.js';
import { TileMatrixSets } from '../tms/index.js';
import { Nztm2000QuadTms, Nztm2000Tms } from '../tms/nztm2000.js';

const TileSize = 256;

const A = 6378137.0;
/** EPSG:3857 origin shift */
const OriginShift = (2 * Math.PI * A) / 2.0;
const InitialResolution = (2 * Math.PI * A) / TileSize;
function getResolution(zoom: number): number {
  return InitialResolution / (1 << zoom);
}

function getPixelsFromMeters(tX: number, tY: number, zoom: number): Point {
  const res = getResolution(zoom);
  const pX = (tX + OriginShift) / res;
  const pY = (tY + OriginShift) / res;
  return { x: pX, y: pY };
}

describe('TileMatrixSet', () => {
  describe('load', () => {
    it('should guess the projection', () => {
      assert.equal(GoogleTms.projection, Epsg.Google);
    });
    it('should load all of the zoom levels', () => {
      for (let i = 0; i < GoogleTms.def.tileMatrix.length; i++) {
        assert.equal(GoogleTms.pixelScale(i) > 0, true);
      }
    });
  });

  it('extent', () => {
    assert.deepEqual(
      GoogleTms.extent.toBbox(),
      [-20037508.3427892, -20037508.3427892, 20037508.3427892, 20037508.3427892],
    );

    const { lowerCorner, upperCorner } = Nztm2000Tms.def.boundingBox;

    assert.deepEqual(Nztm2000Tms.extent.toBbox(), [274000, 3087000, 3327000, 7173000]);
    assert.deepEqual(Nztm2000Tms.extent.toBbox(), [
      lowerCorner[Nztm2000Tms.indexX],
      lowerCorner[Nztm2000Tms.indexY],
      upperCorner[Nztm2000Tms.indexX],
      upperCorner[Nztm2000Tms.indexY],
    ]);
  });

  it('should have correct maxZoom', () => {
    assert.equal(GoogleTms.maxZoom, 24);
    assert.equal(GoogleTms.pixelScale(24) > 0, true);

    assert.equal(Nztm2000Tms.maxZoom, 16);
    assert.equal(Nztm2000Tms.pixelScale(16) > 0, true);
  });

  describe('pixelScale', () => {
    it('should match the old projection logic', () => {
      for (let i = 0; i < 25; i++) {
        Approx.equal(getResolution(i), GoogleTms.pixelScale(i), `${i}`);
      }
    });
  });

  describe('sourceToPixels', () => {
    it('should match the old projection logic', () => {
      for (let i = 0; i < 10; i++) {
        const oldP = getPixelsFromMeters(i, i, i);
        const newP = GoogleTms.sourceToPixels(i, i, i);
        Approx.equal(oldP.x, newP.x, `x_${i}`, 0.1);
        Approx.equal(oldP.y, newP.y, `y_${i}`, 0.1);
      }
    });
  });

  describe('pixelsToSource', () => {
    it('should round trip', () => {
      for (let i = 3; i < 1000; i += 13) {
        const z = i % 20;
        const pixels = GoogleTms.sourceToPixels(i, i, z);
        const source = GoogleTms.pixelsToSource(pixels.x, pixels.y, z);

        Approx.equal(source.x, i, `x${i}_z${z}`, 1e-5);
        Approx.equal(source.y, i, `y${i}_z${z}`, 1e-5);
      }
    });

    it(`should pixelsToSource ${Epsg.Google.toEpsgString()}`, () => {
      const tileSize = 256;
      const googleBound = 20037508.3427892;
      for (let i = 0; i < 1; i++) {
        const extentPx = tileSize * 2 ** i;
        const centerPx = extentPx / 2;
        Approx.point(GoogleTms.pixelsToSource(centerPx, centerPx, i), { x: 0, y: 0 }, 'center');
        Approx.point(GoogleTms.pixelsToSource(extentPx, centerPx, i), { x: googleBound, y: 0 }, 'extentX');
        Approx.point(GoogleTms.pixelsToSource(centerPx, extentPx, i), { x: 0, y: -googleBound });
        Approx.point(GoogleTms.pixelsToSource(extentPx, extentPx, i), { x: googleBound, y: -googleBound });
        Approx.point(GoogleTms.pixelsToSource(0, centerPx, i), { x: -googleBound, y: 0 });
        Approx.point(GoogleTms.pixelsToSource(centerPx, 0, i), { x: 0, y: googleBound });
      }

      Approx.point(GoogleTms.pixelsToSource(0, 0, 0), { x: -googleBound, y: googleBound }, 'z0:extent:ul');
      Approx.point(GoogleTms.pixelsToSource(256, 256, 0), { x: googleBound, y: -googleBound }, 'z0:extent:lr');
    });

    it(`should pixelsToSource ${Epsg.Nztm2000.toEpsgString()}`, () => {
      // Points looked at up in QGIS
      Approx.point(Nztm2000Tms.sourceToPixels(1293759.997, 5412479.999, 0), { x: 256, y: 512 });
      Approx.point(Nztm2000Tms.pixelsToSource(256, 512, 0), { x: 1293760, y: 5412480 });

      Approx.point(Nztm2000Tms.sourceToPixels(2440639.955, 5412480.092, 1), { x: 768, y: 1024 });
      Approx.point(Nztm2000Tms.pixelsToSource(256 * 3, 256 * 4, 1), { x: 2440640, y: 5412480 });
    });
  });

  [Nztm2000Tms, GoogleTms].forEach((tms) => {
    tms.def.tileMatrix.slice(0, 2).forEach((tm, z) => {
      it(`should sourceToPixels -> pixelsToSource ${tms.projection} z:${tm.identifier}`, () => {
        const startX = tm.topLeftCorner[tms.indexX];
        const startY = tm.topLeftCorner[tms.indexY];
        const scale = tms.pixelScale(z) * tm.tileWidth;

        for (let y = 0; y < tm.matrixHeight; y++) {
          for (let x = 0; x < tm.matrixWidth; x++) {
            const sX = startX + x * scale;
            const sY = startY - y * scale;
            const pixels = tms.sourceToPixels(sX, sY, z);
            Approx.equal(pixels.x, x * 256, 'sourceToPixels:x');
            Approx.equal(pixels.y, y * 256, 'sourceToPixels:y');

            const tile = tms.pixelsToSource(pixels.x, pixels.y, z);
            Approx.equal(tile.x, sX, 'pixelsToSource:x');
            Approx.equal(tile.y, sY, 'pixelsToSource:x');
          }
        }
      });
    });
  });

  describe('tileToPixels', () => {
    it('should convert to pixels', () => {
      assert.deepEqual(GoogleTms.tileToPixels(1, 1), { x: 256, y: 256 });
      assert.deepEqual(GoogleTms.tileToPixels(2, 2), { x: 512, y: 512 });
      assert.deepEqual(GoogleTms.tileToPixels(4, 0), { x: 1024, y: 0 });
      assert.deepEqual(GoogleTms.tileToPixels(0, 4), { x: 0, y: 1024 });

      assert.deepEqual(Nztm2000Tms.tileToPixels(1, 1), { x: 256, y: 256 });
      assert.deepEqual(Nztm2000Tms.tileToPixels(2, 2), { x: 512, y: 512 });
      assert.deepEqual(Nztm2000Tms.tileToPixels(4, 0), { x: 1024, y: 0 });
      assert.deepEqual(Nztm2000Tms.tileToPixels(0, 4), { x: 0, y: 1024 });
    });
  });

  describe('pixelsToTile', () => {
    it('should round trip', () => {
      for (let i = 3; i < 1000; i += 13) {
        const pixels = GoogleTms.tileToPixels(i, i);
        const tile = GoogleTms.pixelsToTile(pixels.x, pixels.y, i);
        assert.deepEqual(tile, { x: i, y: i, z: i });
      }
    });
  });

  describe('tileToSource', () => {
    it('should convert to source units', () => {
      assert.deepEqual(GoogleTms.tileToSource({ x: 0, y: 0, z: 0 }), {
        x: -20037508.3427892,
        y: 20037508.3427892,
      });

      assert.deepEqual(GoogleTms.tileToSource({ x: 1, y: 1, z: 0 }), {
        x: 20037508.342789236,
        y: -20037508.342789236,
      });

      assert.deepEqual(GoogleTms.tileToSource(QuadKey.toTile('311331222')), {
        x: 19411336.207076784,
        y: -4304933.433020964,
      });
    });
  });

  describe('convertZoomLevel', () => {
    it('should match the zoom levels from nztm2000', () => {
      for (let i = 0; i < Nztm2000Tms.maxZoom; i++) {
        assert.equal(TileMatrixSet.convertZoomLevel(i, Nztm2000Tms, Nztm2000Tms), i);
      }
    });

    it('should match the zoom levels from google', () => {
      for (let i = 0; i < GoogleTms.maxZoom; i++) {
        assert.equal(TileMatrixSet.convertZoomLevel(i, GoogleTms, GoogleTms), i);
      }
    });

    it('should round trip from Google to NztmQuad', () => {
      for (let i = 0; i < Nztm2000QuadTms.maxZoom; i++) {
        const nztmToGoogle = TileMatrixSet.convertZoomLevel(i, Nztm2000QuadTms, GoogleTms);
        const googleToNztm = TileMatrixSet.convertZoomLevel(nztmToGoogle, GoogleTms, Nztm2000QuadTms);
        assert.equal(googleToNztm, i);
      }
    });

    // Some example current zooms we use for configuration
    const CurrentZooms = [
      { google: 13, nztm: 9, name: 'rural' },
      { google: 14, nztm: 10, name: 'urban' },
    ];
    it('should convert google to nztm', () => {
      for (const zoom of CurrentZooms) {
        const googleToNztm = TileMatrixSet.convertZoomLevel(zoom.google, GoogleTms, Nztm2000Tms);
        const googleToNztmQuad = TileMatrixSet.convertZoomLevel(zoom.google, GoogleTms, Nztm2000QuadTms);
        assert.equal(googleToNztm, zoom.nztm, `Converting ${zoom.name} from ${zoom.google} to ${zoom.nztm}`);
        assert.equal(googleToNztmQuad, zoom.google - 2);
      }
    });

    it('should match zoom levels outside of the range of the target z', () => {
      assert.equal(TileMatrixSet.convertZoomLevel(22, Nztm2000QuadTms, Nztm2000Tms), 16);
      assert.equal(TileMatrixSet.convertZoomLevel(21, Nztm2000QuadTms, Nztm2000Tms), 16);
      assert.equal(TileMatrixSet.convertZoomLevel(20, Nztm2000QuadTms, Nztm2000Tms), 16);
    });

    it('should match the zoom levels from nztm2000 when using nztm2000quad', () => {
      assert.equal(TileMatrixSet.convertZoomLevel(13, Nztm2000QuadTms, Nztm2000Tms), 11);
      assert.equal(TileMatrixSet.convertZoomLevel(12, Nztm2000QuadTms, Nztm2000Tms), 10);
      assert.equal(TileMatrixSet.convertZoomLevel(6, Nztm2000QuadTms, Nztm2000Tms), 4);
    });

    it('should correctly convert Nztm2000 into Nztm2000Qud for rural and urban', () => {
      // Gebco turns on at 0
      assert.equal(TileMatrixSet.convertZoomLevel(0, Nztm2000Tms, Nztm2000QuadTms), 0);

      // Rural turns on at 9
      assert.equal(TileMatrixSet.convertZoomLevel(9, Nztm2000Tms, Nztm2000QuadTms), 12);

      // Urban turns on at 10
      assert.equal(TileMatrixSet.convertZoomLevel(10, Nztm2000Tms, Nztm2000QuadTms), 13);

      // Most things turn off at 17
      assert.equal(TileMatrixSet.convertZoomLevel(17, Nztm2000Tms, Nztm2000QuadTms), Nztm2000QuadTms.maxZoom);
    });
  });

  describe('tileToSourceBounds', () => {
    it('should convert to source bounds', () => {
      assert.deepEqual(round(GoogleTms.tileToSourceBounds({ x: 0, y: 0, z: 0 }).toJson(), 4), {
        x: -20037508.3428,
        y: -20037508.3428,
        width: 40075016.6856,
        height: 40075016.6856,
      });

      assert.deepEqual(round(GoogleTms.tileToSourceBounds(QuadKey.toTile('311331222')).toJson(), 4), {
        x: 19411336.2071,
        y: -4383204.95,
        width: 78271.517,
        height: 78271.517,
      });
    });
  });

  describe('topLevelTiles', () => {
    it('should return covering tiles of level 0 extent', () => {
      assert.deepEqual(Array.from(GoogleTms.topLevelTiles()), [{ x: 0, y: 0, z: 0 }]);
      assert.deepEqual(Array.from(Nztm2000Tms.topLevelTiles()), [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 0, y: 2, z: 0 },
        { x: 1, y: 2, z: 0 },
        { x: 0, y: 3, z: 0 },
        { x: 1, y: 3, z: 0 },
      ]);
    });
  });

  describe('tileToName nameToTile', () => {
    it('should make a name of the tile z,x,y', () => {
      assert.equal(TileMatrixSet.tileToName({ x: 4, y: 5, z: 6 }), '6-4-5');
      assert.deepEqual(TileMatrixSet.nameToTile('6-4-5'), { x: 4, y: 5, z: 6 });
    });
  });

  describe('findBestZoom', () => {
    it('should find a similar scale', () => {
      assert.equal(GoogleTms.findBestZoom(GoogleTms.def.tileMatrix[1].scaleDenominator), 1);
      assert.equal(GoogleTms.findBestZoom(GoogleTms.def.tileMatrix[10].scaleDenominator), 10);
      assert.equal(GoogleTms.findBestZoom(GoogleTms.def.tileMatrix[15].scaleDenominator), 15);

      assert.equal(Nztm2000Tms.findBestZoom(Nztm2000Tms.def.tileMatrix[1].scaleDenominator), 1);
      assert.equal(Nztm2000Tms.findBestZoom(Nztm2000Tms.def.tileMatrix[10].scaleDenominator), 10);
      assert.equal(Nztm2000Tms.findBestZoom(Nztm2000Tms.def.tileMatrix[15].scaleDenominator), 15);

      assert.equal(Nztm2000QuadTms.findBestZoom(Nztm2000QuadTms.def.tileMatrix[1].scaleDenominator), 1);
      assert.equal(Nztm2000QuadTms.findBestZoom(Nztm2000QuadTms.def.tileMatrix[10].scaleDenominator), 10);
      assert.equal(Nztm2000QuadTms.findBestZoom(Nztm2000QuadTms.def.tileMatrix[15].scaleDenominator), 15);
    });

    it('should find similar scales across tile matrix sets', () => {
      for (let i = 0; i < Nztm2000QuadTms.maxZoom; i++) {
        assert.equal(GoogleTms.findBestZoom(Nztm2000QuadTms.def.tileMatrix[i].scaleDenominator), i + 2);
      }

      assert.equal(Nztm2000QuadTms.findBestZoom(Nztm2000Tms.def.tileMatrix[0].scaleDenominator), 2);
    });

    it('should map test urban/rural scales correctly', () => {
      assert.equal(Nztm2000Tms.findBestZoom(GoogleTms.zooms[13].scaleDenominator), 9);
      assert.equal(Nztm2000Tms.findBestZoom(GoogleTms.zooms[14].scaleDenominator), 10);

      assert.equal(Nztm2000QuadTms.findBestZoom(GoogleTms.zooms[13].scaleDenominator), 11);
      assert.equal(Nztm2000QuadTms.findBestZoom(GoogleTms.zooms[14].scaleDenominator), 12);
    });
  });

  describe('coverTile', () => {
    it('should return covering tiles of level n extent', () => {
      assert.deepEqual(Array.from(GoogleTms.coverTile({ x: 2, y: 3, z: 3 })), [
        { x: 4, y: 6, z: 4 },
        { x: 5, y: 6, z: 4 },
        { x: 4, y: 7, z: 4 },
        { x: 5, y: 7, z: 4 },
      ]);
      assert.deepEqual(Array.from(Nztm2000Tms.coverTile({ x: 2, y: 3, z: 8 })), [
        { x: 4, y: 6, z: 9 },
        { x: 5, y: 6, z: 9 },
        { x: 4, y: 7, z: 9 },
        { x: 5, y: 7, z: 9 },
      ]);
      assert.deepEqual(Array.from(Nztm2000Tms.coverTile({ x: 2, y: 3, z: 7 })), [
        { x: 5, y: 7, z: 8 },
        { x: 6, y: 7, z: 8 },
        { x: 7, y: 7, z: 8 },
        { x: 5, y: 8, z: 8 },
        { x: 6, y: 8, z: 8 },
        { x: 7, y: 8, z: 8 },
        { x: 5, y: 9, z: 8 },
        { x: 6, y: 9, z: 8 },
        { x: 7, y: 9, z: 8 },
      ]);

      assert.deepEqual(Array.from(Nztm2000Tms.coverTile({ x: 3, y: 2, z: 7 })), [
        { x: 7, y: 5, z: 8 },
        { x: 8, y: 5, z: 8 },
        { x: 9, y: 5, z: 8 },
        { x: 7, y: 6, z: 8 },
        { x: 8, y: 6, z: 8 },
        { x: 9, y: 6, z: 8 },
        { x: 7, y: 7, z: 8 },
        { x: 8, y: 7, z: 8 },
        { x: 9, y: 7, z: 8 },
      ]);
    });
  });

  describe('TileMatrixSets', () => {
    it('should find by epsg', () => {
      assert.equal(TileMatrixSets.find('epsg:2193')?.identifier, Nztm2000Tms.identifier);
      assert.equal(TileMatrixSets.find('2193')?.identifier, Nztm2000Tms.identifier);
      assert.equal(TileMatrixSets.find('epsg:3857')?.identifier, GoogleTms.identifier);
      assert.equal(TileMatrixSets.find('3857')?.identifier, GoogleTms.identifier);
    });

    it('should find by name', () => {
      assert.equal(TileMatrixSets.find(Nztm2000Tms.identifier)?.identifier, Nztm2000Tms.identifier);
      assert.equal(TileMatrixSets.find(Nztm2000QuadTms.identifier)?.identifier, Nztm2000QuadTms.identifier);
      assert.equal(TileMatrixSets.find(GoogleTms.identifier)?.identifier, GoogleTms.identifier);
    });
  });
});

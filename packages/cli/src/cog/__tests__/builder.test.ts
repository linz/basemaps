import { Bounds, Epsg, EpsgCode, GoogleTms } from '@basemaps/geo';
import { LogConfig } from '@basemaps/shared';
import { fsa } from '@chunkd/fs';
import { CogTiff } from '@cogeotiff/core';

import o from 'ospec';
import { CogBuilder, guessProjection } from '../builder.js';

o.spec('Builder', () => {
  o('should guess WKT', () => {
    o(
      guessProjection(
        'PCS Name = NZGD_2000_New_Zealand_Transverse_Mercator|GCS Name = GCS_NZGD_2000|Ellipsoid = GRS_1980|Primem = Greenwich||',
      ),
    ).equals(Epsg.Nztm2000);

    o(
      guessProjection('NZGD2000_New_Zealand_Transverse_Mercator_2000|GCS Name = GCS_NZGD_2000|Primem = Greenwich||'),
    ).equals(Epsg.Nztm2000);
  });

  o('should not guess unknown wkt', () => {
    o(guessProjection('')).equals(null);
    o(guessProjection('NZTM')).equals(null);
    o(guessProjection('NZGD2000')).equals(null);
  });

  o.spec('tiff', () => {
    const googleBuilder = new CogBuilder(GoogleTms, 1, LogConfig.get());
    const origInit = CogTiff.prototype.init;
    const origGetImage = CogTiff.prototype.getImage;

    o.after(() => {
      CogTiff.prototype.init = origInit;
      CogTiff.prototype.getImage = origGetImage;
    });

    o('bounds', async () => {
      const localTiff = fsa.source('/local/file.tiff')!;
      const s3Tiff = fsa.source('s3://bucket/file.tiff')!;

      const imageLocal = {
        resolution: [0.1],
        value: (): any => [1],
        valueGeo: (): any => EpsgCode.Nztm2000,
        bbox: Bounds.fromJson({
          x: 1492000,
          y: 6198000,
          width: 24000,
          height: 36000,
        }).toBbox(),
      };

      const imageS3 = {
        resolution: [0.1],
        value: (): any => [1],
        valueGeo: (): any => EpsgCode.Nztm2000,
        bbox: Bounds.fromJson({
          x: 1492000 + 24000,
          y: 6198000,
          width: 24000,
          height: 36000,
        }).toBbox(),
      };

      CogTiff.prototype.init = o.spy() as any;
      CogTiff.prototype.getImage = function (): any {
        return this.source === localTiff ? imageLocal : imageS3;
      };

      const ans = await googleBuilder.bounds([localTiff, s3Tiff]);

      o(ans).deepEquals({
        projection: 2193,
        nodata: 1,
        bands: 1,
        bounds: [
          {
            x: 1492000,
            y: 6198000,
            width: 24000,
            height: 36000,
            name: '/local/file.tiff',
          },
          {
            x: 1516000,
            y: 6198000,
            width: 24000,
            height: 36000,
            name: 's3://bucket/file.tiff',
          },
        ],
        pixelScale: 0.1,
        resZoom: 21,
      });
    });
  });
});

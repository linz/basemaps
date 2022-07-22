import { GoogleTms, ImageFormat, Nztm2000QuadTms, Nztm2000Tms, VectorFormat } from '@basemaps/geo';
import o from 'ospec';
import { mockUrlRequest } from '../../__tests__/xyz.util.js';
import { Validate } from '../validate.js';

o.spec('GetImageFormats', () => {
  o('should parse all formats', () => {
    const req = mockUrlRequest('/v1/blank', 'format=png&format=jpeg');
    const formats = Validate.getRequestedFormats(req);
    o(formats).deepEquals([ImageFormat.Png, ImageFormat.Jpeg]);
  });

  o('should ignore bad formats', () => {
    const req = mockUrlRequest('/v1/blank', 'format=fake&format=mvt');
    const formats = Validate.getRequestedFormats(req);
    o(formats).equals(null);
  });

  o('should de-dupe formats', () => {
    const req = mockUrlRequest('/v1/blank', 'format=png&format=jpeg&format=png&format=jpeg&format=png&format=jpeg');
    const formats = Validate.getRequestedFormats(req);
    o(formats).deepEquals([ImageFormat.Png, ImageFormat.Jpeg]);
  });

  o('should support "tileFormat" Alias all formats', () => {
    const req = mockUrlRequest('/v1/blank', 'tileFormat=png&format=jpeg');
    const formats = Validate.getRequestedFormats(req);
    o(formats).deepEquals([ImageFormat.Jpeg, ImageFormat.Png]);
  });

  o('should not duplicate "tileFormat" alias all formats', () => {
    const req = mockUrlRequest('/v1/blank', 'tileFormat=jpeg&format=jpeg');
    const formats = Validate.getRequestedFormats(req);
    o(formats).deepEquals([ImageFormat.Jpeg]);
  });
});

o.spec('getTileMatrixSet', () => {
  o('should lookup epsg codes', () => {
    o(Validate.getTileMatrixSet('EPSG:3857')?.identifier).equals(GoogleTms.identifier);
    o(Validate.getTileMatrixSet('EPSG:2193')?.identifier).equals(Nztm2000Tms.identifier);

    o(Validate.getTileMatrixSet('3857')?.identifier).equals(GoogleTms.identifier);
    o(Validate.getTileMatrixSet('2193')?.identifier).equals(Nztm2000Tms.identifier);
  });

  o('should lookup by identifier', () => {
    o(Validate.getTileMatrixSet('WebMercatorQuad')?.identifier).equals(GoogleTms.identifier);
    o(Validate.getTileMatrixSet('NZTM2000Quad')?.identifier).equals(Nztm2000QuadTms.identifier);
    o(Validate.getTileMatrixSet('Nztm2000')?.identifier).equals(Nztm2000Tms.identifier);
  });

  o('should be case sensitive', () => {
    o(Validate.getTileMatrixSet('Nztm2000Quad')?.identifier).equals(undefined);
  });
});

o.spec('getTileFormat', () => {
  for (const ext of Object.values(ImageFormat)) {
    o('should support image format:' + ext, () => {
      o(Validate.getTileFormat(ext)).equals(ext);
    });
  }

  o('should support vector format: mvt', () => {
    o(Validate.getTileFormat('pbf')).equals(VectorFormat.MapboxVectorTiles);
  });

  for (const fmt of ['FAKE', /* 'JPEG' // TODO should this be case sensitive ,*/ 'mvt', 'json']) {
    o('should not support format:' + fmt, () => {
      o(Validate.getTileFormat(fmt)).equals(null);
    });
  }
});

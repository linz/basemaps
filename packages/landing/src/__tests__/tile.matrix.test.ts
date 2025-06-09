import assert from 'node:assert';
import { describe, it } from 'node:test';

import { GoogleTms, locationTransform, Nztm2000QuadTms, Nztm2000Tms } from '@basemaps/geo';

describe('locationTransform', () => {
  const Precision = 10 ** 8;

  it('should return the same google coordinate', () => {
    const location = { lat: -41.2953946, lon: 174.7812425, zoom: 15.5128 };
    assert.deepEqual(location, locationTransform(location, GoogleTms, GoogleTms));
  });

  it('should return get the nztm location', () => {
    const location = { lat: -41.29539461, lon: 174.78124251, zoom: 15.5128 };
    const nztmLocation = locationTransform(location, Nztm2000QuadTms, GoogleTms);
    assert.deepEqual(nztmLocation, { lon: 0.01247576, lat: -0.0680115, zoom: 15.5128 });
  });

  it('should return Transform Back', () => {
    const location = { lat: -41.29539461, lon: 174.78124251, zoom: 15.5128 };
    const nztmLocation = locationTransform(location, Nztm2000QuadTms, GoogleTms);
    const back = locationTransform(nztmLocation, GoogleTms, Nztm2000QuadTms);
    assert.deepEqual(location, {
      lon: Math.round(back.lon * Precision) / Precision,
      lat: Math.round(back.lat * Precision) / Precision,
      zoom: back.zoom,
    });
  });

  it('should not convert between non google tms', () => {
    const location = { lat: -41.29539461, lon: 174.78124251, zoom: 15.5128 };
    assert.throws(() => locationTransform(location, Nztm2000QuadTms, Nztm2000Tms), Error);
  });
});

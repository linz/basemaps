import { GoogleTms, Nztm2000QuadTms } from '@basemaps/geo';
import o from 'ospec';
import { locationTransform } from '../tile.matrix.js';

o.spec('locationTransform', () => {
  const Precision = 10 ** 8;

  o('should return the same google coordinate', () => {
    const location = { lat: -41.2953946, lon: 174.7812425, zoom: 15.5128 };
    o(location).deepEquals(locationTransform(location, GoogleTms, GoogleTms));
  });

  o('should return get the nztm location', () => {
    const location = { lat: -41.29539461, lon: 174.78124251, zoom: 15.5128 };
    const nztmLocation = locationTransform(location, Nztm2000QuadTms, GoogleTms);
    o(nztmLocation).deepEquals({ lon: 0.01247576, lat: -0.0680115, zoom: 15.5128 });
  });

  o('should return Transform Back', () => {
    const location = { lat: -41.29539461, lon: 174.78124251, zoom: 15.5128 };
    const nztmLocation = locationTransform(location, Nztm2000QuadTms, GoogleTms);
    const back = locationTransform(nztmLocation, GoogleTms, Nztm2000QuadTms);
    o(location).deepEquals({
      lon: Math.round(back.lon * Precision) / Precision,
      lat: Math.round(back.lat * Precision) / Precision,
      zoom: back.zoom,
    });
  });
});

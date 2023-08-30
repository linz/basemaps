import { LocationUrl } from '../url';
import o from 'ospec';

o('LocationUrl', () => {
  o('should encode lon lat', () => {
    const loc = { lat: 174.7763921, lon: -41.277848, zoom: 8 };
    const output = LocationUrl.toLocation(loc);

    o(output).deepEquals(`#`);
  });
});

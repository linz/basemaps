import { LocationUrl } from '../url.js';
import o from 'ospec';

o.spec('LocationUrl', () => {
  o('should encode lon lat', () => {
    o(LocationUrl.toLocation({ lat: 174.7763921, lon: -41.277848, zoom: 8 })).equals(`@174.77639,-41.27785,z8`);
    o(LocationUrl.toLocation({ lat: 174.7763921, lon: -41.277848, zoom: 10 })).equals(`@174.77639,-41.27785,z10`);
    o(LocationUrl.toLocation({ lat: 174.7763921, lon: -41.277848, zoom: 18 })).equals(`@174.776392,-41.277848,z18`);
    o(LocationUrl.toLocation({ lat: 174.7763921, lon: -41.2778481, zoom: 20 })).equals(`@174.7763921,-41.2778481,z20`);
    o(LocationUrl.toLocation({ lat: 174.7763921, lon: -41.2778481, zoom: 22 })).equals(`@174.7763921,-41.2778481,z22`);

    // Common floating point fun
    o(LocationUrl.toLocation({ lat: 0.1 + 0.2, lon: -41.2778481, zoom: 22 })).equals(`@0.3,-41.2778481,z22`);
  });

  o('should round trip', () => {
    o(LocationUrl.toLocation({ lat: 174.7763921, lon: -41.277848, zoom: 8 })).equals(`@174.77639,-41.27785,z8`);
    o(LocationUrl.fromLocation('@174.77639,-41.27785,z8')).deepEquals({ lat: 174.77639, lon: -41.27785, zoom: 8 });
  });

  o('should fail if zoom is outside of bounds', () => {
    o(LocationUrl.fromLocation('@174.77639,-41.27785,z0')).notEquals(null);

    o(LocationUrl.fromLocation('@174.77639,-41.27785,z-1')).equals(null);
    o(LocationUrl.fromLocation('@174.77639,-41.27785,z33')).equals(null);
  });

  o('should fail if lon is outside of bounds', () => {
    o(LocationUrl.fromLocation('@174.77639,-41.27785,z1')).notEquals(null);

    o(LocationUrl.fromLocation('@174.77639,-141.27785,z1')).equals(null);
    o(LocationUrl.fromLocation('@174.77639,141.27785,z1')).equals(null);
  });

  o('should fail if lat is outside of bounds', () => {
    o(LocationUrl.fromLocation('@174.77639,-41.27785,z1')).notEquals(null);
    o(LocationUrl.fromLocation('@274.77639,-41.27785,z1')).equals(null);
    o(LocationUrl.fromLocation('@-274.77639,-41.27785,z1')).equals(null);
  });

  o('should truncate trialing 0s', () => {
    o(LocationUrl.toLocation({ lat: 174, lon: -41, zoom: 8.12345 })).equals(`@174,-41,z8.12`);
    o(LocationUrl.toLocation({ lat: 174, lon: -41, zoom: 8.000001 })).equals(`@174,-41,z8`);

    // TODO is this desired behaviour?
    o(LocationUrl.toLocation({ lat: 174, lon: -41.10000001, zoom: 8.000001 })).equals(`@174,-41.1,z8`);
  });
});

import o from 'ospec';

import { LocationSlug } from '../slug.js';

o.spec('LocationUrl', () => {
  o('should encode lon lat', () => {
    o(LocationSlug.toSlug({ lat: -41.2778481, lon: 174.7763921, zoom: 8 })).equals(`@-41.2778481,174.7763921,z8`);
    o(LocationSlug.toSlug({ lat: -41.2778481, lon: 174.7763921, zoom: 10 })).equals(`@-41.2778481,174.7763921,z10`);
    o(LocationSlug.toSlug({ lat: -41.2778481, lon: 174.7763921, zoom: 18 })).equals(`@-41.2778481,174.7763921,z18`);
    o(LocationSlug.toSlug({ lat: -41.2778481, lon: 174.7763921, zoom: 20 })).equals(`@-41.2778481,174.7763921,z20`);
    o(LocationSlug.toSlug({ lat: -41.2778481, lon: 174.7763921, zoom: 22 })).equals(`@-41.2778481,174.7763921,z22`);

    // Common floating point fun
    o(LocationSlug.toSlug({ lat: 0.1 + 0.2, lon: -41.2778481, zoom: 22 })).equals(`@0.3000000,-41.2778481,z22`);
  });

  o('should work from screenshot examples', () => {
    o(LocationSlug.fromSlug('#@-41.2890657,174.7769262,z16')).deepEquals({
      lat: -41.2890657,
      lon: 174.7769262,
      zoom: 16,
    });
  });

  o('should round trip', () => {
    o(LocationSlug.toSlug({ lat: -41.277848, lon: 174.7763921, zoom: 8 })).equals(`@-41.2778480,174.7763921,z8`);
    o(LocationSlug.fromSlug(`@-41.2778480,174.7763921,z8`)).deepEquals({ lat: -41.277848, lon: 174.7763921, zoom: 8 });
  });

  o('should fail if zoom is outside of bounds', () => {
    o(LocationSlug.fromSlug('@-41.27785,174.77639,z0')).notEquals(null);

    o(LocationSlug.fromSlug('@-41.27785,174.77639,z-1')).equals(null);
    o(LocationSlug.fromSlug('@-41.27785,174.77639,z33')).equals(null);
  });

  o('should fail if lat is outside of bounds', () => {
    o(LocationSlug.fromSlug('@-41.27785,174.77639,z1')).notEquals(null);

    o(LocationSlug.fromSlug('@-141.27785,174.77639,z1')).equals(null);
    o(LocationSlug.fromSlug('@141.27785,174.77639,z1')).equals(null);
  });

  o('should fail if lon is outside of bounds', () => {
    o(LocationSlug.fromSlug('@-41.27785,174.77639,z1')).notEquals(null);
    o(LocationSlug.fromSlug('@-41.27785,274.77639,z1')).equals(null);
    o(LocationSlug.fromSlug('@-41.27785,-274.77639,z1')).equals(null);
  });
});

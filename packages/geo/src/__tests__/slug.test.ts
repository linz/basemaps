import { LocationSlug, removeTrailingZeros } from '../slug.js';
import o from 'ospec';

o.spec('LocationUrl', () => {
  o('should encode lon lat', () => {
    o(LocationSlug.toSlug({ lat: -41.277848, lon: 174.7763921, zoom: 8 })).equals(`@-41.27785,174.77639,z8`);
    o(LocationSlug.toSlug({ lat: -41.277848, lon: 174.7763921, zoom: 10 })).equals(`@-41.27785,174.77639,z10`);
    o(LocationSlug.toSlug({ lat: -41.277848, lon: 174.7763921, zoom: 18 })).equals(`@-41.277848,174.776392,z18`);
    o(LocationSlug.toSlug({ lat: -41.2778481, lon: 174.7763921, zoom: 20 })).equals(`@-41.2778481,174.7763921,z20`);
    o(LocationSlug.toSlug({ lat: -41.2778481, lon: 174.7763921, zoom: 22 })).equals(`@-41.2778481,174.7763921,z22`);

    // Common floating point fun
    o(LocationSlug.toSlug({ lat: 0.1 + 0.2, lon: -41.2778481, zoom: 22 })).equals(`@0.3,-41.2778481,z22`);
  });

  o('should work from screenshot examples', () => {
    o(LocationSlug.fromSlug('#@-41.2890657,174.7769262,z16')).deepEquals({
      lat: -41.2890657,
      lon: 174.7769262,
      zoom: 16,
    });
  });

  o('should round trip', () => {
    o(LocationSlug.toSlug({ lat: -41.277848, lon: 174.7763921, zoom: 8 })).equals(`@-41.27785,174.77639,z8`);
    o(LocationSlug.fromSlug('@-41.27785,174.77639,z8')).deepEquals({ lat: -41.27785, lon: 174.77639, zoom: 8 });
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

  o('should truncate trialing 0s', () => {
    o(LocationSlug.toSlug({ lat: -41, lon: 174, zoom: 8.12345 })).equals(`@-41,174,z8.1235`);
    o(LocationSlug.toSlug({ lat: -41, lon: 174, zoom: 8.000001 })).equals(`@-41,174,z8`);

    // TODO is this desired behaviour?
    o(LocationSlug.toSlug({ lat: -41, lon: 174.10000001, zoom: 8.000001 })).equals(`@-41,174.1,z8`);
  });

  o('should remove trailing zeros', () => {
    o(removeTrailingZeros('3.0')).equals('3');
    o(removeTrailingZeros('3.0000')).equals('3');
    o(removeTrailingZeros('7.1000')).equals('7.1');
    o(removeTrailingZeros('7.1234560')).equals('7.123456');
  });
});

import o from 'ospec';

import { toQueryString } from '../url.js';

o.spec('toQueryString', () => {
  o('should create a  query string', () => {
    o(toQueryString({ api: 'foo' })).equals('?api=foo');
  });

  o('should not create empty query strings', () => {
    o(toQueryString({})).equals('');
    o(toQueryString({ api: undefined } as any)).equals('');
    o(toQueryString({ api: null } as any)).equals('');
  });

  o('should sort keys', () => {
    o(toQueryString({ z: 'z', a: 'a' })).equals('?a=a&z=z');
  });
});

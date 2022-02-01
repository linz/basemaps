import { Env } from '@basemaps/shared';
import o from 'ospec';
import { convertRelativeUrl } from '../routes/tile.style.json.js';

o.spec('TileStyleJson', () => {
  const host = 'https://tiles.test';
  let originalHost: string | undefined;
  o.beforeEach(() => {
    originalHost = process.env[Env.PublicUrlBase];
    process.env[Env.PublicUrlBase] = host;
  });

  o.afterEach(() => {
    process.env[Env.PublicUrlBase] = originalHost;
  });

  o('should not convert empty urls', () => {
    o(convertRelativeUrl()).equals('');
    o(convertRelativeUrl('')).equals('');
    o(convertRelativeUrl(undefined)).equals('');
  });

  o('should only convert relative urls', () => {
    o(convertRelativeUrl('/foo')).equals('https://tiles.test/foo');
    o(convertRelativeUrl('/bar/baz/')).equals('https://tiles.test/bar/baz/');
  });

  o('should only convert with api keys', () => {
    o(convertRelativeUrl('/foo', 'abc')).equals('https://tiles.test/foo?api=abc');
    o(convertRelativeUrl('/bar/baz/', 'abc')).equals('https://tiles.test/bar/baz/?api=abc');
  });

  o('should convert with other query params', () => {
    o(convertRelativeUrl('/foo?bar=baz', 'abc')).equals('https://tiles.test/foo?bar=baz&api=abc');
  });

  o('should not convert full urls', () => {
    o(convertRelativeUrl('https://foo.com/foo?bar=baz', 'abc')).equals('https://foo.com/foo?bar=baz');
  });
});

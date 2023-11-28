import o from 'ospec';

import { ConfigId } from '../base.config.js';
import { ConfigPrefix } from '../config/prefix.js';

o.spec('ConfigPrefix', () => {
  o('should prefix values', () => {
    o(ConfigId.prefix(ConfigPrefix.TileSet, '123')).equals('ts_123');
    o(ConfigId.prefix(ConfigPrefix.Imagery, '123')).equals('im_123');
  });

  o('should unprefix values', () => {
    o(ConfigId.unprefix(ConfigPrefix.TileSet, 'ts_123')).equals('123');
    o(ConfigId.unprefix(ConfigPrefix.Imagery, 'im_123')).equals('123');
  });

  o('should not unprefix unknown values', () => {
    o(ConfigId.unprefix(ConfigPrefix.TileSet, 'im_123')).equals('im_123');
    o(ConfigId.unprefix(ConfigPrefix.Imagery, 'ts_123')).equals('ts_123');
  });

  o('should get prefix values', () => {
    o(ConfigId.getPrefix('ts_123')).equals(ConfigPrefix.TileSet);
    o(ConfigId.getPrefix('im_123')).equals(ConfigPrefix.Imagery);
  });

  o('should not return unknown prefixes', () => {
    o(ConfigId.getPrefix('jj_123')).equals(null);
    o(ConfigId.getPrefix('123')).equals(null);
    o(ConfigId.getPrefix('_123')).equals(null);
    o(ConfigId.getPrefix('123_123')).equals(null);
  });
});

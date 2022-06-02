import o from 'ospec';
import { Config } from '../base.config.js';
import { ConfigPrefix } from '../config/prefix.js';

o.spec('ConfigPrefix', () => {
  o('should prefix values', () => {
    o(Config.prefix(ConfigPrefix.TileSet, '123')).equals('ts_123');
    o(Config.prefix(ConfigPrefix.Imagery, '123')).equals('im_123');
  });

  o('should unprefix values', () => {
    o(Config.unprefix(ConfigPrefix.TileSet, 'ts_123')).equals('123');
    o(Config.unprefix(ConfigPrefix.Imagery, 'im_123')).equals('123');
  });

  o('should not unprefix unknown values', () => {
    o(Config.unprefix(ConfigPrefix.TileSet, 'im_123')).equals('im_123');
    o(Config.unprefix(ConfigPrefix.Imagery, 'ts_123')).equals('ts_123');
  });

  o('should get prefix values', () => {
    o(Config.getPrefix('ts_123')).equals(ConfigPrefix.TileSet);
    o(Config.getPrefix('im_123')).equals(ConfigPrefix.Imagery);
  });

  o('should not return unknown prefixes', () => {
    o(Config.getPrefix('jj_123')).equals(null);
    o(Config.getPrefix('123')).equals(null);
    o(Config.getPrefix('_123')).equals(null);
    o(Config.getPrefix('123_123')).equals(null);
  });
});

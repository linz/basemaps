import o from 'ospec';
import { ConfigDebug, DebugDefaults, DebugState } from '../config.debug.js';

function urlToString(o: Partial<DebugState>): string {
  const url = new URLSearchParams();
  ConfigDebug.toUrl(o as DebugState, url);
  return url.toString();
}

o.spec('ConfigDebug', () => {
  o('should only serialize when not defaults', () => {
    o(urlToString(DebugDefaults)).equals('');
  });

  o('should write to url', () => {
    o(urlToString({ debug: true })).equals('debug=true');
    o(urlToString({ debug: false })).equals('');
    o(urlToString({ debug: true, 'debug.background': 'magenta' })).equals('debug=true&debug.background=magenta');
  });

  o('should round trip', () => {
    const cfg = { ...DebugDefaults };
    cfg.debug = true;
    cfg['debug.background'] = 'magenta';
    cfg['debug.layer.linz-topographic'] = 0.5;
    cfg['debug.layer.linz-aerial'] = -1;

    const url = urlToString(cfg);
    const newCfg = { ...DebugDefaults };
    ConfigDebug.fromUrl(newCfg, new URLSearchParams(`?${url}`));
    o(newCfg).deepEquals(cfg);
  });
});

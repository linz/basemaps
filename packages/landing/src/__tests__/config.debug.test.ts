import assert from 'node:assert';
import { describe, it } from 'node:test';

import { ConfigDebug, DebugDefaults, DebugState } from '../config.debug.js';

function urlToString(o: Partial<DebugState>): string {
  const url = new URLSearchParams();
  ConfigDebug.toUrl(o as DebugState, url);
  return url.toString();
}

describe('ConfigDebug', () => {
  it('should only serialize when not defaults', () => {
    assert.equal(urlToString(DebugDefaults), '');
  });

  it('should write to url', () => {
    assert.equal(urlToString({ debug: true }), 'debug=true');
    assert.equal(urlToString({ debug: false }), '');
    assert.equal(urlToString({ debug: true, 'debug.background': 'magenta' }), 'debug=true&debug.background=magenta');
  });

  it('should round trip', () => {
    const cfg = { ...DebugDefaults };
    cfg.debug = true;
    cfg['debug.background'] = 'magenta';
    cfg['debug.layer.linz-labels'] = 0.5;
    cfg['debug.layer.linz-aerial'] = -1;

    const url = urlToString(cfg);
    const newCfg = { ...DebugDefaults };
    ConfigDebug.fromUrl(newCfg, new URLSearchParams(`?${url}`));
    assert.deepEqual(newCfg, cfg);
  });
});

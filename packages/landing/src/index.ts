import './global.js';

import { Basemaps } from './map.js';
import { WindowUrl } from './url.js';
import { BasemapsUi } from './ui.js';
import { isWebpSupported } from './webp.js';
import { addDebugLayer } from './debug.js';
import { SplitIo, SplitTreatment } from './split.js';

const canUseWebp = isWebpSupported();

document.addEventListener('DOMContentLoaded', async () => {
  const mapEl = document.getElementById('map');
  if (mapEl == null) throw new Error('Cannot find #map element');
  if (await canUseWebp) WindowUrl.ImageFormat = 'webp';

  const basemaps = new Basemaps(mapEl);
  window.basemaps = basemaps;

  const ui = new BasemapsUi(basemaps);
  window.basemapsUi = ui;

  if (basemaps.config.debug) addDebugLayer(basemaps);

  SplitIo.getClient().then((client) => {
    if (client == null) return;

    // const isLayerSwitcherOn = SplitIo.getTreatment(SplitTreatment.LayerSwitcherButton);
  });
});

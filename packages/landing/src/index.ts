import './global';

import { Basemaps } from './map';
import { WindowUrl } from './url';
import { BasemapsUi } from './ui';
import { isWebpSupported } from './webp';
import { addDebugLayer } from './debug';

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
});

import './global';

import { Basemaps } from './map';
import { addDebugLayer } from './debug';
import { WindowUrl } from './url';

// Source https://stackoverflow.com/questions/5573096/detecting-webp-support
function canUseWebP(): boolean {
    const elem = document.createElement('canvas');

    if (!!(elem.getContext && elem.getContext('2d'))) {
        // was able or not to get WebP representation
        return elem.toDataURL('image/webp').indexOf('data:image/webp') == 0;
    }

    // very old browser like IE 8, canvas not supported
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    const mapEl = document.getElementById('map');
    if (mapEl == null) throw new Error('Cannot find #map element');
    if (canUseWebP()) WindowUrl.ImageFormat = 'webp';

    const basemaps = new Basemaps(mapEl);
    window.basemaps = basemaps;

    if (basemaps.config.debug) addDebugLayer(basemaps);
});

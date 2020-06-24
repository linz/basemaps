import './global';

import { Basemaps } from './map';
import { addDebugLayer } from './debug';

document.addEventListener('DOMContentLoaded', () => {
    const mapEl = document.getElementById('map');
    if (mapEl == null) throw new Error('Cannot find #map element');
    const basemaps = new Basemaps(mapEl);
    window.basemaps = basemaps;

    if (basemaps.config.debug) addDebugLayer(basemaps);
});

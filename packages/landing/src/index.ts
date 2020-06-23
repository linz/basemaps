import './global';

import { Basemaps } from './map';

document.addEventListener('DOMContentLoaded', () => {
    const mapEl = document.getElementById('map');
    if (mapEl == null) throw new Error('Cannot find #map element');
    window.basemaps = new Basemaps(mapEl);
});

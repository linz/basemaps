import './global';
import 'ol/ol.css';

import { Basemaps } from './map';

document.addEventListener('DOMContentLoaded', () => {
    const mapEl = document.getElementById('map');
    if (mapEl == null) throw new Error('Cannot find #map element');
    window.basemaps = new Basemaps(mapEl);
});

import { Attribution } from './attribution.js';

declare global {
    interface Window {
        // Access to basemaps global
        BasemapsAttribution: typeof Attribution;
    }
}

window.BasemapsAttribution = Attribution;

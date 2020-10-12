import { Attribution } from './attribution';

declare global {
    interface Window {
        // Access to basemaps global
        BasemapsAttribution: typeof Attribution;
    }
}

window.BasemapsAttribution = Attribution;

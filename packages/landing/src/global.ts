import { Basemaps } from './map';

declare global {
    interface Window {
        // Google analytics
        dataLayer: any[];
        gtag(...args: any[]): void;

        // Access to basemaps global
        basemaps: Basemaps;
    }
}

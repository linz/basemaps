import { Basemaps } from './map';
import { BasemapsUi } from './ui';

declare global {
    interface Window {
        // Google analytics
        dataLayer: any[];
        gtag(...args: any[]): void;

        // Access to basemaps global
        basemaps: Basemaps;
        basemapsUi: BasemapsUi;
    }
}

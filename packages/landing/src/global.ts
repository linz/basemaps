import { Basemaps } from './map.js';
import { SplitIo } from './split.js';
import { BasemapsUi } from './ui.js';

declare global {
  interface Window {
    // Google analytics
    dataLayer: any[];
    gtag(...args: any[]): void;

    // Access to basemaps global
    basemaps: Basemaps;
    basemapsUi: BasemapsUi;

    splitIo: typeof SplitIo;
  }
}

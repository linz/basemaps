import { SplitIo } from './split.js';

declare global {
  interface Window {
    // Google analytics
    dataLayer: any[];
    gtag(...args: any[]): void;

    splitIo: typeof SplitIo;
  }
}

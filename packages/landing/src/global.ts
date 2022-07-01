export {};

declare global {
  interface Window {
    // Google analytics
    dataLayer: any[];
    gtag(...args: any[]): void;
  }
}

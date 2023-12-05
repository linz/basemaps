export {};

declare global {
  interface Window {
    // Google analytics
    dataLayer: unknown[];
    gtag(...args: unknown[]): void;

    // Expose for testing
    MaplibreMap?: maplibregl.Map;
  }
}

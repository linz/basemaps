import { iterate } from './iterate.js';

/**
 * Number of decimal places to restrict capture areas to
 * Rough numbers of decimal places to precision in meters
 *
 * 5DP - 1m
 * 6DP - 0.1m
 * 7DP - 0.01m (1cm)
 * 8DP - 0.001m (1mm)
 */
const DefaultTruncationFactor = 8;

/**
 * Truncate a multi polygon in lat,lng to {@link DefaultTruncationFactor} decimal places
 *
 * @warning This destroys the source geometry
 * @param polygons
 */
export function truncate(feature: GeoJSON.Feature, truncateFactor = DefaultTruncationFactor): void {
  const factor = Math.pow(10, truncateFactor);

  iterate(feature, (pt) => {
    pt[0] = Math.round(pt[0] * factor) / factor;
    pt[1] = Math.round(pt[1] * factor) / factor;
  });
}

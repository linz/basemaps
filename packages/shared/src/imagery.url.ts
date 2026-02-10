import { ConfigImagery, standardizeLayerName } from '@basemaps/config';
import { Bounds, Projection, Size, TileMatrixSets } from '@basemaps/geo';

export const PreviewSize = { width: 1200, height: 630 };

/**
 * Find the approximate center and zoom level for of a imagery set
 *
 * @param imageryList
 * @param previewSize
 * @returns approximate center and zoom level for the imagery set
 */
export function getImageryCenterZoom(
  imagery: ConfigImagery | ConfigImagery[],
  previewSize: Size = PreviewSize,
): { lat: number; lon: number; zoom: number } {
  const bounds = Array.isArray(imagery) ? Bounds.union(imagery.map((i) => i.bounds)) : imagery.bounds;
  const tileMatrix = Array.isArray(imagery) ? imagery[0].tileMatrix : imagery.tileMatrix;
  const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };

  // Find a approximate GSD needed to show most of the imagery
  const aspectWidth = bounds.width / previewSize.width;
  const aspectHeight = bounds.height / previewSize.height;
  const bestAspect = Math.min(aspectHeight, aspectWidth);

  const tms = TileMatrixSets.find(tileMatrix);
  if (tms == null) throw new Error(`Failed to lookup tileMatrix: ${tileMatrix}`);
  const proj = Projection.get(tms);
  const centerLatLon = proj.toWgs84([center.x, center.y]);
  const targetZoom = Math.max(tms.findBestZoom(bestAspect) - 12, 0);
  return { lat: centerLatLon[1], lon: centerLatLon[0], zoom: targetZoom };
}

/**
 * Create a slug for a location that can be used in basemaps links and is human readable
 *
 * in the format `@${lat},${lon},z${llz.zoom}`;
 *
 * @example "@-36.5518610,174.8770907,z8"
 * @param llz
 * @returns
 */
export function toSlug(llz: { lat: number; lon: number; zoom: number }): string {
  const lat = llz.lat.toFixed(7);
  const lon = llz.lon.toFixed(7);
  return `@${lat},${lon},z${llz.zoom}`;
}

export interface PreviewConfig {
  /** imagery to create a preview URL for */
  imagery: ConfigImagery;
  /** output preview size */
  size?: Size;
  /** optional configuration location */
  config?: string;
  /** optional pipeline to use */
  pipeline?: string;
}

export interface PreviewResult {
  /**
   * relative URL to the preview location
   *
   * @example
   *
   * "/v1/preview/..."
   */
  url: string;

  /**
   * standardized name of the layer
   */
  name: string;

  /**
   * location slug useful for basemaps links
   *
   * @example "@-36.5518610,174.8770907,z8"
   */
  slug: string;

  /**
   * Components of the slug broken out into their parts
   */
  location: { lat: number; lon: number; zoom: number };

  /**
   * Query string parameters for t he preview including config and pipeline if needed
   *
   * @example
   * "?config=s3://...&pipeline=terrain-rgb"
   */
  query: string;
}

export function getPreviewUrl(ctx: PreviewConfig): PreviewResult {
  const location = getImageryCenterZoom(ctx.imagery, ctx.size);
  const targetZoom = location.zoom;
  const lat = location.lat.toFixed(7);
  const lon = location.lon.toFixed(7);

  const name = standardizeLayerName(ctx.imagery.name);
  const query = getPreviewQuery(ctx);
  return {
    name,
    location,
    slug: toSlug(location),
    query,
    url: `/v1/preview/${name}/${ctx.imagery.tileMatrix}/${targetZoom}/${lon}/${lat}${query}`,
  };
}

/**
 * Create a query string for a preview URL using pipeline and configuration if they are needed
 *
 * @param ctx
 * @returns a query string prefixed with `?` if it is needed, empty string otherwise
 */
export function getPreviewQuery(ctx: { config?: string | null; pipeline?: string | null }): string {
  const urlSearch = new URLSearchParams();
  if (ctx.config) urlSearch.set('config', ctx.config);
  if (ctx.pipeline) urlSearch.set('pipeline', ctx.pipeline);
  if (urlSearch.size === 0) return '';
  return '?' + urlSearch.toString();
}

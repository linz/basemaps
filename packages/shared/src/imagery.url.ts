import { ConfigImagery, standardizeLayerName } from '@basemaps/config';
import { BoundingBox, Bounds, Projection, Size, TileMatrixSets } from '@basemaps/geo';

export const PreviewSize = { width: 1200, height: 630 };

export function getImageryListCenterZoom(imageryList: ConfigImagery[], previewSize: Size): { lat: number; lon: number; zoom: number } {
  if (imageryList.length === 0) throw new Error('No imagery provided');
  const bounds = Bounds.union(imageryList.map((i) => Bounds.fromJson(i.bounds)));
  return getImageryCenterZoom({ bounds, tileMatrix: imageryList[0].tileMatrix }, previewSize);
}

export function getImageryCenterZoom(im: { bounds: BoundingBox, tileMatrix: string }, previewSize: Size): { lat: number; lon: number; zoom: number } {
  const center = { x: im.bounds.x + im.bounds.width / 2, y: im.bounds.y + im.bounds.height / 2 };

  // Find a approximate GSD needed to show most of the imagery
  const aspectWidth = im.bounds.width / previewSize.width;
  const aspectHeight = im.bounds.height / previewSize.height;
  const bestAspect = Math.min(aspectHeight, aspectWidth);

  const tms = TileMatrixSets.find(im.tileMatrix);
  if (tms == null) throw new Error(`Failed to lookup tileMatrix: ${im.tileMatrix}`);
  const proj = Projection.get(tms);
  const centerLatLon = proj.toWgs84([center.x, center.y]);
  const targetZoom = Math.max(tms.findBestZoom(bestAspect) - 12, 0);
  return { lat: centerLatLon[1], lon: centerLatLon[0], zoom: targetZoom };
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
  const location = getImageryCenterZoom(ctx.imagery, ctx.size ?? PreviewSize);
  const targetZoom = location.zoom;
  const lat = location.lat.toFixed(7);
  const lon = location.lon.toFixed(7);
  const slug = `@${lat},${lon},z${location.zoom}`;

  const name = standardizeLayerName(ctx.imagery.name);
  const query = getPreviewQuery(ctx);
  return {
    name,
    location,
    slug,
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

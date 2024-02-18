import { ConfigImagery, standardizeLayerName } from '@basemaps/config';
import { Projection, Size, TileMatrixSets } from '@basemaps/geo';

export const PreviewSize = { width: 1200, height: 630 };

export function getImageryCenterZoom(im: ConfigImagery, previewSize: Size): { lat: number; lon: number; zoom: number } {
  const center = { x: im.bounds.x + im.bounds.width / 2, y: im.bounds.y + im.bounds.height / 2 };

  // Find a approximate GSD needed to show most of the imagery
  const aspectWidth = im.bounds.width / previewSize.width;
  const aspectHeight = im.bounds.height / previewSize.height;
  const bestAspect = Math.min(aspectHeight, aspectWidth);

  const tms = TileMatrixSets.find(im.tileMatrix);
  if (tms == null) throw new Error(`Failed to lookup tileMatrix: ${im.tileMatrix}`);
  const proj = Projection.get(tms);
  const centerLatLon = proj.toWgs84([center.x, center.y]);
  const targetZoom = Math.max(tms.findBestZoom(bestAspect) - 7, 0);
  return { lat: centerLatLon[1], lon: centerLatLon[0], zoom: targetZoom };
}

export function getPreviewUrl(
  im: ConfigImagery,
  previewSize: Size = PreviewSize,
  pipeline?: string,
): {
  url: string;
  name: string;
  locationHash: string;
  location: { lat: number; lon: number; zoom: number };
} {
  const location = getImageryCenterZoom(im, previewSize);
  const targetZoom = location.zoom;
  const lat = location.lat.toFixed(7);
  const lon = location.lon.toFixed(7);
  const locationHash = `@${lat},${lon},z${location.zoom}`;

  const query = pipeline ? `?pipeline=${pipeline}` : '';

  const name = standardizeLayerName(im.name);
  return {
    name,
    location,
    locationHash,
    url: `/v1/preview/${name}/${im.tileMatrix}/${targetZoom}/${lon}/${lat}${query}`,
  };
}

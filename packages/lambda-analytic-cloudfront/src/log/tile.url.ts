import { GoogleTms, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';

function isValidExt(ext: string): boolean {
  switch (ext) {
    case 'webp':
    case 'jpeg':
    case 'png':
    case 'avif':
    // Vector
    case 'pbf':
      return true;
  }
  return false;
}

const tileMatrixLookup = new Map<string, TileMatrixSet | null>();

// Validate
// - /v1/tiles/aerial/EPSG:2193/12.67876636397893/11737/18011.jpeg

export interface TileUrlInfo {
  extension: string;

  tileSet: string;

  /**
   * Raw tile matrix used
   *
   * @example "3857" "EPSG:3857"
   */
  tileMatrix: string;
  /**
   * Tile Matrix Used
   * @example "NZTM2000Quad"
   */
  tileMatrixId: 'NZTM2000Quad' | 'WebMercatorQuad' | 'NZTM2000';

  /** Zoom used from in the tile matrix  */
  z: number;

  /** closes zoom level in web mercator quad  */
  webMercatorZoom: number;
}

export function parseTileUrl(status: number, url: string): TileUrlInfo | undefined {
  if (!url.startsWith('/v1/tiles')) return;
  if (status > 399) return;

  // /v1/tiles/topographic/EPSG:3857/tile.json
  // /v1/tiles/topographic/EPSG:3857/style/topolite.json
  const lastDot = url.lastIndexOf('.');
  if (lastDot === -1) return; // no extension ignore

  let ext = url.slice(lastDot + 1);
  if (ext === 'jpg') ext = 'jpeg'; // standardise "jpg" into "jpeg"
  const tileSetType = isValidExt(ext);
  if (tileSetType == null) return;

  // /v1/tiles/:tileSet/:tileMatrixId/:z/:x/:y.:ext
  const urlPart = url.split('/');
  const tileSet = urlPart[3];
  const tileMatrixPart = urlPart[4];

  let tileMatrix = tileMatrixLookup.get(tileMatrixPart);
  if (tileMatrix === undefined) {
    tileMatrix = TileMatrixSets.find(tileMatrixPart);
    tileMatrixLookup.set(tileMatrixPart, tileMatrix);
  }
  if (tileMatrix == null) return; // TileMatrix not found

  const z = Number.parseInt(urlPart[5]);

  // Check tile is in valid ranges
  if (isNaN(z)) return;
  if (z < 0) return;

  // Convert the zoom to webmercator zoom scales
  const webMercatorZoom = TileMatrixSet.convertZoomLevel(z, tileMatrix, GoogleTms);

  return {
    extension: ext,
    tileSet,
    tileMatrix: tileMatrixPart,
    tileMatrixId: tileMatrix.identifier as TileUrlInfo['tileMatrixId'],
    z,
    webMercatorZoom,
  };
}

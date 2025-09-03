import {
  Epsg,
  getXyOrder,
  GoogleTms,
  Projection,
  ProjectionLoader,
  TileMatrixSet,
  TileMatrixSetType,
} from '../index.js';

/**
 * Minimal typings of PROJJSON
 */
interface ProjJsonAxis {
  name: string;
  abbreviation?: string;
  direction: string;
  unit: string;
}

/**
 * Find a zoom level that has approximately the same bounds as those of the source projection.
 * The WebMercatorQuad projection covers the entire world. So, most other projections do not work well outside
 * their own bounds. Therefore, we want to find a zoom level that does not overflow the bounds too much.
 *
 * @param minSize
 * @returns one zoom level bigger than the minimum zoom level
 */
function findZoomOffset(minSize: number): number {
  for (let i = 1; i < GoogleTms.maxZoom; i++) {
    const size = GoogleTms.pixelScale(i) * 256;
    const sizeDiff = minSize - size;
    if (sizeDiff > 0) return Math.max(0, i - 1);
  }
  return 0;
}

/**
 * Normalize axis names to X or Y
 *
 * @param ax Axis
 * @returns Normalized axis name
 * @throws if axis is unknown
 */
function axisName(ax: ProjJsonAxis): 'x' | 'y' {
  if (ax.abbreviation == null) {
    throw new Error('Axis abbreviation is null');
  }

  switch (ax.abbreviation.toLowerCase()) {
    case 'x':
    case 'e':
      return 'x';
    case 'y':
    case 'n':
      return 'y';
    default:
      throw new Error('Unknown axis abbreviation: ' + ax.abbreviation);
  }
}

export class TmsLoader {
  /**
   * Stores generated TileMatrixSets objects in memory by Epsg
   */
  private static readonly GeneratedTileMatrices = new Map<Epsg, TileMatrixSet>();

  /**
   * Attempts to generate a runtime Tile Matrix Set for the given target projection.
   *
   * - Lookup the projection information from spatial reference
   * - Attempt to find the bounds of the projection
   * - Using the bounds, attempt to find a tile matrix zoom level that would cover the entire bounds
   * - Generate a runtime tile matrix definition
   *
   * @param epsgCode - An Epsg code expressing the target projection (e.g. 3788, 5479, or 32702)
   * @returns the generated tile matrix definition
   */
  static async load(epsgCode: number): Promise<TileMatrixSet> {
    // load the epsg code's projection definition
    const epsg = await ProjectionLoader.load(epsgCode);
    const proj = Projection.get(epsg);

    // check if a TileMatrixSet object has already been generated for the Epsg
    const existing = TmsLoader.GeneratedTileMatrices.get(epsg);
    if (existing != null) return existing;

    // fetch projection metadata from the spatialreference.org API,
    // this givens us valid axis information and geographic bounding box
    const projJson = proj.definition;
    if (projJson == null) throw new Error('Unable to load projection json for:' + epsg.toEpsgString());

    // transform the bounding box to projected coordinates
    // convert from lat/lon (wgs84) to the target projection's coordinate system
    if (projJson.bbox == null) throw new Error('Bounding box is null');
    const upperLeft = proj.fromWgs84([projJson.bbox.west_longitude, projJson.bbox.north_latitude]);
    const lowerRight = proj.fromWgs84([projJson.bbox.east_longitude, projJson.bbox.south_latitude]);

    // calculate the larger dimension of the target projection's bounding box
    // find the larger dimension (width or height) to determine appropriate zoom level
    const width = Math.abs(upperLeft[0] - lowerRight[0]);
    const height = Math.abs(upperLeft[1] - lowerRight[1]);
    const largestDimension = Math.max(width, height);
    const zOffset = findZoomOffset(largestDimension);

    // find the center point of the target projection's bounds
    const centerLon = (projJson.bbox.west_longitude + projJson.bbox.east_longitude) / 2;
    const centerLat = (projJson.bbox.north_latitude + projJson.bbox.south_latitude) / 2;

    // calculate tile dimensions for the starting zoom level
    const tileZeroWidth = GoogleTms.pixelScale(zOffset) * 256;
    const halfTileZeroWidth = tileZeroWidth / 2;

    // transform center point to projected coordinates
    const centerProjected = proj.fromWgs84([centerLon, centerLat]);

    // clone Google's tile matrix so we can use it as a template,
    // this gives us a structure for which we can modify the details
    const tileMatrix = structuredClone(GoogleTms.def) as TileMatrixSetType & { $generated: unknown; $options: unknown };

    // some projections use x-y order whereas others use y-x
    const xyOrder = getXyOrder(epsg);
    const xy = xyOrder === 'xy' ? { x: 0, y: 1 } : { x: 1, y: 0 };

    // ensure the axis order matches the x-y order
    if (projJson.coordinate_system == null) throw new Error('Coordinate system is null');
    const axisOrder = projJson.coordinate_system.axis.map(axisName).join('');
    if (xyOrder !== axisOrder) {
      throw new Error(`getXyOrder: ${axisOrder} is not the same as expected ordering from proj json`);
    }

    // set the bounding box - a square centered on the projection center
    tileMatrix.boundingBox.lowerCorner = [
      centerProjected[xy.x] - halfTileZeroWidth, // left edge
      centerProjected[xy.y] - halfTileZeroWidth, // bottom edge
    ];
    tileMatrix.boundingBox.upperCorner = [
      centerProjected[xy.x] + halfTileZeroWidth, // right edge
      centerProjected[xy.y] + halfTileZeroWidth, // top edge
    ];

    // remove the google-specific scale set reference since we're creating our own
    delete tileMatrix.wellKnownScaleSet;

    // rebuild the zoom level definitions
    // create a standard pyramid starting from the calculated zoom offset
    tileMatrix.tileMatrix = tileMatrix.tileMatrix.slice(zOffset).map((x, i) => {
      x.identifier = String(i);
      x.matrixWidth = 2 ** i;
      x.matrixHeight = 2 ** i;
      x.topLeftCorner = [tileMatrix.boundingBox.upperCorner[0], tileMatrix.boundingBox.lowerCorner[1]];
      return x;
    });

    // update tile matrix metadata
    tileMatrix.title = 'Auto-generated tile matrix for EPSG:' + epsgCode;

    if (projJson.name == null) throw new Error('Name is null');
    tileMatrix.identifier = projJson.name.replace(/ /g, '').replace(/\//g, '_');

    tileMatrix.supportedCRS = `https://www.opengis.net/def/crs/EPSG/0/${epsgCode}`;
    tileMatrix.boundingBox.crs = tileMatrix.supportedCRS;

    // capture tile matrix generation metadata
    tileMatrix['$generated'] = { createdAt: new Date().toISOString() };
    tileMatrix['$options'] = { sourceTileMatrix: GoogleTms.identifier, zoomOffset: zOffset };

    const tileMatrixSet = new TileMatrixSet(tileMatrix);

    // store the generated TileMatrixSet object by Epsg
    TmsLoader.GeneratedTileMatrices.set(epsg, tileMatrixSet);
    return tileMatrixSet;
  }
}

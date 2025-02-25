import { Bounds, Epsg, Size, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { RasterTypeKey, Tiff, TiffTagGeo } from '@cogeotiff/core';
import path from 'path';

export const brokenTiffs = {
  noBounds: [] as string[],
  noEpsg: [] as string[],
  noSize: [] as string[],
  noTileMatrix: [] as string[],
};

/**
 * Attempts to extract a bounds set from the given Tiff object.
 *
 * @param tiff: the Tiff object from which to extract a bounds set.
 *
 * @returns a Bounds object, on success. Otherwise, null.
 */
export function extractBoundsFromTiff(tiff: Tiff, logger?: LogType): Bounds | null {
  const img = tiff.images[0];
  if (img == null) {
    logger?.error({ source: tiff.source.url.href }, 'extractBoundsFromTiff(): No images found in Tiff file');
    return null;
  }

  if (img.valueGeo(TiffTagGeo.GTRasterTypeGeoKey) === RasterTypeKey.PixelIsPoint) {
    logger?.error(
      { source: tiff.source.url.href },
      'extractBoundsFromTiff(): Pixel is Point raster grid spacing is not supported',
    );
    return null;
  }

  try {
    return Bounds.fromBbox(img.bbox);
  } catch {
    logger?.info({ found: false }, 'extractBoundsFromTiff()');
    return null;
  }
}

const projections: Record<string, Epsg> = {
  'Universal Transverse Mercator Zone': Epsg.Wgs84,
  'Chatham Islands Transverse Mercator 2000': Epsg.Citm2000,
  'New Zealand Transverse Mercator 2000': Epsg.Nztm2000,
};

/**
 * Attempts to extract an epsg value from the given Tiff object.
 *
 * @param tiff: The Tiff object from which to extract an epsg value.
 *
 * @returns an Epsg instance, on success. Otherwise, null.
 */
export function extractEpsgFromTiff(tiff: Tiff, logger?: LogType): Epsg | null {
  const img = tiff.images[0];
  if (img == null) {
    logger?.error({ source: tiff.source.url.href }, 'extractEpsgFromTiff(): No images found in Tiff file');
    return null;
  }

  // try to extract the epsg directly from the tiff
  const epsg = img.epsg;

  if (epsg != null) {
    const code = Epsg.tryGet(epsg);

    if (code != null) {
      logger?.info({ found: true, method: 'direct', source: tiff.source.url.href }, 'extractEpsgFromTiff()');
      return code;
    }
  }

  // try to extract the epsg from the tiff's projected citation geotag
  const tag = img.valueGeo(TiffTagGeo.ProjectedCitationGeoKey);

  if (typeof tag === 'string') {
    for (const [citation, epsg] of Object.entries(projections)) {
      if (tag.startsWith(citation)) {
        logger?.info({ found: true, method: 'geotag', source: tiff.source.url.href }, 'extractEpsgFromTiff()');
        return epsg;
      }
    }
  }

  logger?.info({ found: false }, 'extractEpsgFromTiff()');
  return null;
}

/**
 * Attempts to extract a map code and version from the filename of the provided filepath.
 * Throws an error if either detail cannot be parsed.
 *
 * @param file: the filepath from which to extract a map code and version.
 *
 * @example
 * file: "s3://linz-topographic-upload/topographic/TopoReleaseArchive/NZTopo50_GeoTif_Gridless/CJ10_GRIDLESS_GeoTifv1-00.tif"
 * returns: { mapCode: "CJ10", version: "v1-00" }
 *
 * @returns an object containing the map code and version.
 */
export function extractMapCodeAndVersion(url: URL, logger?: LogType): { mapCode: string; version: string } {
  const filePath = path.parse(url.href);
  const fileName = filePath.name;

  // extract map code from head of the file name (e.g. CJ10)
  const mapCode = fileName.split('_')[0];
  if (mapCode == null) throw new Error('Map sheet not found in the file name');

  // extract version from tail of the file name (e.g. v1-00)
  const version = fileName.match(/v(\d)-(\d\d)/)?.[0];
  if (version == null) throw new Error('Version not found in the file name');

  logger?.info({ mapCode, version }, 'extractMapCodeAndVersion()');
  return { mapCode, version };
}

/**
 * Attempts to extract a size from the given Tiff object.
 *
 * @param tiff: the Tiff object from which to extract the size.
 *
 * @returns a Size object, on success. Otherwise, null.
 */
export function extractSizeFromTiff(tiff: Tiff, logger?: LogType): Size | null {
  try {
    const size = tiff.images[0]?.size ?? null;

    logger?.info({ source: tiff.source.url.href, found: true, size }, 'extractSizeFromTiff()');
    return size;
  } catch (e) {
    logger?.error({ source: tiff.source.url.href, found: false }, 'extractSizeFromTiff()');
    return null;
  }
}

export interface TiffItem {
  tiff: Tiff;
  source: URL;
  mapCode: string;
  version: string;
  bounds: Bounds;
  epsg: Epsg;
  size: Size;
  tileMatrix: TileMatrixSet;
  latest?: string;
}

/**
 * Converts Tiffs to TiffItems, returning a Map of Epsgs to TiffItem arrays.
 *
 * For each Tiff, this function extracts its core data, converts it into a TiffItem, and
 * stores it in a Map by its Epsg. A Tiff is skipped if it's missing any piece of core data.
 *
 * @param tiffs: the list of Tiffs to convert into TiffItems and group by Epsg.
 *
 * @returns a Map of TiffItem arrays by Epsg.
 */
export function extractTiffItemsByEpsg(tiffs: Tiff[], logger: LogType): Map<Epsg, TiffItem[]> {
  const tiffItemsByEpsg = new Map<Epsg, TiffItem[]>();

  // create TiffItem objects for each tiff and store them by epsg
  for (const tiff of tiffs) {
    const source = tiff.source.url;
    const { mapCode, version } = extractMapCodeAndVersion(source, logger);

    const bounds = extractBoundsFromTiff(tiff, logger);
    const epsg = extractEpsgFromTiff(tiff, logger);
    const size = extractSizeFromTiff(tiff, logger);
    const tileMatrix = TileMatrixSets.tryGet(epsg);

    if (bounds == null) {
      brokenTiffs.noBounds.push(`${mapCode}_${version}`);
      logger.warn({ mapCode, version }, 'Could not extract bounds from tiff');
      continue;
    }

    if (epsg == null) {
      brokenTiffs.noEpsg.push(`${mapCode}_${version}`);
      logger.warn({ mapCode, version }, 'Could not extract epsg from tiff');
      continue;
    }

    if (size == null) {
      brokenTiffs.noSize.push(`${mapCode}_${version}`);
      logger.warn({ mapCode, version }, 'Could not extract width or height from tiff');
      continue;
    }

    if (tileMatrix == null) {
      brokenTiffs.noTileMatrix.push(`${mapCode}_${version}`);
      if (epsg != null) {
        logger.warn({ mapCode, version }, `Could not convert epsg code '${epsg.code}' to a tile matrix`);
      }
      continue;
    }

    const item: TiffItem = { tiff, source, mapCode, version, bounds, epsg, size, tileMatrix };

    // store the created TiffItem Object by epsg
    const items = tiffItemsByEpsg.get(epsg);
    if (items == null) {
      tiffItemsByEpsg.set(epsg, [item]);
    } else {
      items.push(item);
    }
  }

  return tiffItemsByEpsg;
}

/**
 * Identifies the latest TiffItems by map code and version, returning a Map of map codes to TiffItems.
 *
 * For each TiffItem, this function determines whether it's the latest version of those with the same map code.
 * If so, this function stores it in a Map by its map code.
 *
 * @param tiffItems: the list of TiffItems to filter and group by map code.
 *
 * @returns a Map of TiffItems by map code.
 */
export function extractLatestTiffItemsByMapCode(tiffItems: TiffItem[]): Map<string, TiffItem> {
  const latest = new Map<string, TiffItem>();

  // identify the latest item by 'version' and copy it to 'latest'
  for (const item of tiffItems) {
    const mapCode = item.mapCode;
    const latestItem = latest.get(mapCode);

    if (latestItem == null || latestItem.version.localeCompare(item.version) < 0) {
      latest.set(mapCode, item);
    }
  }

  return latest;
}

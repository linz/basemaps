import {
  Bounds,
  EpsgCode,
  ImageFormat,
  NamedBounds,
  Nztm2000QuadTms,
  StacCollection,
  TileMatrixSets,
} from '@basemaps/geo';
import { fsa } from '@chunkd/fs';
import { CogTiff } from '@cogeotiff/core';
import pLimit from 'p-limit';
import { basename } from 'path';
import { sha256base58 } from '../base58.node.js';
import { ConfigImagery } from '../config/imagery.js';
import { ConfigTileSetRaster, TileSetType } from '../config/tile.set.js';
import { ConfigProviderMemory } from '../memory/memory.config.js';
import { ConfigJson } from './json.config.js';
/** Does a file look like a tiff, ending in .tif or .tiff */
function isTiff(f: string): boolean {
  const lowered = f.toLocaleLowerCase();
  return lowered.endsWith('.tif') || lowered.endsWith('.tiff');
}

/** Summary of a collection of tiffs */
interface TiffSummary {
  /** List of tiffs and their extents */
  files: NamedBounds[];
  /** Overall bounding box */
  bounds: Bounds;
  /** EpsgCode for the tiffs */
  epsg: number;
}

/**
 * Read all tiffs from a target path and ensure all tiffs contain the same GSD and EPSG code,
 * while computing bounding boxes for the entire imagery set
 *
 * @throws if any of the tiffs have differing EPSG or GSD
 **/
function computeTiffSummary(target: string, tiffs: CogTiff[]): TiffSummary {
  const res: Partial<TiffSummary> = { files: [] };

  for (const tiff of tiffs) {
    const firstImage = tiff.getImage(0);
    const imgBounds = Bounds.fromBbox(firstImage.bbox);

    const epsg = firstImage.epsg;
    if (epsg == null) throw new Error(`No ESPG projection found. source:` + tiff.source.uri);

    // Validate all EPSG codes are the same for each imagery set
    if (res.epsg == null) res.epsg = epsg;
    else if (res.epsg !== epsg) {
      throw new Error(`ESPG projection mismatch on imagery ${res.epsg} vs ${epsg} source:` + tiff.source.uri);
    }

    if (res.bounds == null) res.bounds = imgBounds;
    else res.bounds = res.bounds.union(imgBounds);

    if (res.files == null) res.files = [];
    res.files.push({ name: tiff.source.uri.replace(target, ''), ...imgBounds });
  }
  if (res.bounds == null) throw new Error('Failed to extract imagery bounds from:' + target);
  if (res.epsg == null) throw new Error('Failed to extract imagery epsg from:' + target);
  if (res.files == null || res.files.length === 0) throw new Error('Failed to extract imagery from:' + target);
  return res as TiffSummary;
}

/** Attempt to read a stac collection.json from the target path if it exists or return null if anything goes wrong. */
async function loadStacFromPath(target: string): Promise<StacCollection | null> {
  const collectionPath = fsa.join(target, 'collection.json');
  try {
    return await fsa.readJson(collectionPath);
  } catch (e) {
    return null;
  }
}

/**
 * Attempt to load all imagery inside of a path and create a configuration from it
 *
 * @param target path that contains the imagery
 *
 * @returns Imagery configuration generated from the path
 */
export async function imageryFromTiffPath(target: string, Q: pLimit.Limit): Promise<ConfigImagery> {
  const sourceFiles = await fsa.toArray(fsa.list(target));
  const tiffs = await Promise.all(
    sourceFiles.filter(isTiff).map((c) => Q(() => new CogTiff(fsa.source(c)).init(true))),
  );

  const stac = await loadStacFromPath(target);
  const params = computeTiffSummary(target, tiffs);

  const folderName = basename(target);
  const title = stac?.title ?? folderName;
  const tileMatrix = params.epsg === EpsgCode.Nztm2000 ? Nztm2000QuadTms : TileMatrixSets.tryGet(params.epsg);
  if (tileMatrix == null) throw new Error('No tile matrix found for projection: ' + params.epsg);

  const imagery: ConfigImagery = {
    id: sha256base58(target),
    name: folderName,
    title,
    updatedAt: Date.now(),
    projection: tileMatrix.projection.code,
    tileMatrix: tileMatrix.identifier,
    uri: target,
    bounds: params.bounds,
    files: params.files,
  };
  imagery.overviews = await ConfigJson.findImageryOverviews(imagery);

  await Promise.all(tiffs.map((t) => t.close()));
  return imagery;
}

/**
 * Create configuration from a folder full of tiffs or a folder of folders of tiffs
 *
 * Given the following folder structure
 *
 * ```
 * /imagery/invercargill_2022_0.05m/*.tiff
 * /imagery/wellington_2022_0.05/*.tiff
 * ```
 *
 * A. A single imagery datasets
 *
 * ```
 * target = ["/imagery/invercargill_2022_0.05m/"]
 * ```
 *
 * will load all tiffs from the resulting folder into a single tile set `aerial`
 *
 * B: A tree of imagery datasets
 *
 * ```
 * target = ["/imagery/invercargill_2022_0.05m/", "/imagery/wellington_2022_0.05/*.tiff"]
 * ```
 *
 * will load all tiffs from all folders targets into a single tile set "aerial",
 * then load each folder into their own tile set.
 *
 * The rendering order will be the order of the target locations
 *
 * tile sets:  aerial, wellington_2022_0.05, invercargill_2022_0.05m
 *
 * @param provider where to store all the configuration generated
 * @param targets the target location
 * @param concurrency number of tiff files to load at a time
 * @returns
 */
export async function initConfigFromPaths(
  provider: ConfigProviderMemory,
  targets: string[],
  concurrency = 25,
): Promise<{ tileSet: ConfigTileSetRaster; imagery: ConfigImagery[] }> {
  const q = pLimit(concurrency);

  const imageryConfig: Promise<ConfigImagery>[] = [];
  for (const target of targets) imageryConfig.push(imageryFromTiffPath(target, q));

  const aerialTileSet: ConfigTileSetRaster = {
    id: 'ts_aerial',
    name: 'aerial',
    title: 'Basemaps',
    category: 'Basemaps',
    type: TileSetType.Raster,
    format: ImageFormat.Webp,
    layers: [],
  };

  provider.put(aerialTileSet);
  const configs = await Promise.all(imageryConfig);
  for (const cfg of configs) {
    cfg.id = provider.Imagery.id(cfg.id); // Ensure the ID is properly prefixed
    provider.put(cfg);

    let existingLayer = aerialTileSet.layers.find((l) => l.title === cfg.title);
    if (existingLayer == null) {
      existingLayer = { name: cfg.name, title: cfg.title };
      aerialTileSet.layers.push(existingLayer);
    }
    existingLayer[cfg.projection] = cfg.id;
  }

  return { tileSet: aerialTileSet, imagery: configs };
}

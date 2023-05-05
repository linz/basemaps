import {
  BoundingBox,
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
import pLimit, { LimitFunction } from 'p-limit';
import { basename, resolve } from 'path';
import { sha256base58 } from '../base58.node.js';
import { ConfigImagery } from '../config/imagery.js';
import { ConfigTileSetRaster, TileSetType } from '../config/tile.set.js';
import { ConfigProviderMemory } from '../memory/memory.config.js';
import { ConfigJson } from './json.config.js';
import { LogType } from './log.js';

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
  bounds: BoundingBox;
  /** EpsgCode for the tiffs */
  projection: number;
  /** Ground sample distance, number of meters per pixel */
  gsd: number;
}

export type ConfigImageryTiff = ConfigImagery & TiffSummary;

/**
 * Read all tiffs from a target path and ensure all tiffs contain the same GSD and EPSG code,
 * while computing bounding boxes for the entire imagery set
 *
 * @throws if any of the tiffs have differing EPSG or GSD
 **/
function computeTiffSummary(target: string, tiffs: CogTiff[]): TiffSummary {
  const res: Partial<TiffSummary> = { files: [] };

  let bounds: Bounds | undefined;
  for (const tiff of tiffs) {
    const firstImage = tiff.getImage(0);

    const epsg = firstImage.epsg;
    if (epsg == null) throw new Error(`No ESPG projection found. source:` + tiff.source.uri);

    // Validate all EPSG codes are the same for each imagery set
    if (res.projection == null) res.projection = epsg;
    else if (res.projection !== epsg) {
      throw new Error(`ESPG projection mismatch on imagery ${res.projection} vs ${epsg} source:` + tiff.source.uri);
    }

    const gsd = firstImage.resolution[0];
    if (res.gsd == null) res.gsd = gsd;
    else {
      const gsdDiff = Math.abs(res.gsd - gsd);
      if (gsdDiff > 0.001) throw new Error(`GSD mismatch on imagery ${res.gsd} vs ${gsd}`);
    }

    const gsdRound = Math.floor(gsd * 100) / 10000;
    const bbox = firstImage.bbox.map((f) => Math.floor(f / gsdRound) * gsdRound);
    const imgBounds = Bounds.fromBbox(bbox);

    if (bounds == null) bounds = imgBounds;
    else bounds = bounds.union(imgBounds);

    if (res.files == null) res.files = [];
    res.files.push({ name: tiff.source.uri, ...imgBounds });
  }
  res.bounds = bounds?.toJson();
  if (res.bounds == null) throw new Error('Failed to extract imagery bounds from:' + target);
  if (res.projection == null) throw new Error('Failed to extract imagery epsg from:' + target);
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
export async function imageryFromTiffPath(target: string, Q: LimitFunction, log?: LogType): Promise<ConfigImageryTiff> {
  const sourceFiles = await fsa.toArray(fsa.list(target));
  const tiffs = await Promise.all(
    sourceFiles.filter(isTiff).map((c) => Q(() => new CogTiff(fsa.source(c)).init(true))),
  );

  try {
    const stac = await loadStacFromPath(target);
    const params = computeTiffSummary(target, tiffs);

    const folderName = basename(target);
    const title = stac?.title ?? folderName;
    const tileMatrix =
      params.projection === EpsgCode.Nztm2000 ? Nztm2000QuadTms : TileMatrixSets.tryGet(params.projection);

    const imagery: ConfigImageryTiff = {
      id: sha256base58(target),
      name: folderName,
      title,
      updatedAt: Date.now(),
      projection: params.projection,
      tileMatrix: tileMatrix?.identifier ?? 'none',
      gsd: params.gsd,
      uri: resolve(target),
      bounds: params.bounds,
      files: params.files,
    };
    imagery.overviews = await ConfigJson.findImageryOverviews(imagery);
    log?.info({ title, files: imagery.files.length }, 'Tiff:Loaded');

    return imagery;
  } finally {
    await Promise.all(tiffs.map((t) => t.close()));
  }
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
  log?: LogType,
): Promise<{ tileSet: ConfigTileSetRaster; imagery: ConfigImageryTiff[] }> {
  const q = pLimit(concurrency);

  const imageryConfig: Promise<ConfigImageryTiff>[] = [];
  for (const target of targets) imageryConfig.push(imageryFromTiffPath(target, q, log));

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

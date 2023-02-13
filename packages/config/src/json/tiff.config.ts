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

function isTiff(f: string): boolean {
  const lowered = f.toLocaleLowerCase();
  return lowered.endsWith('.tif') || lowered.endsWith('.tiff');
}

/** Ground sample Distance is a floating point, allow a small amount of error between tiffs */
const GsdFloatingErrorAllowance = 0.000001;

/**
 * Read all tiffs from a target path and ensure all tiffs contain the same GSD and EPSG code,
 * while computing bounding boxes for the entire imagery set
 **/
function computeTiffParameters(
  target: string,
  tiffs: CogTiff[],
): { files: NamedBounds[]; bounds: Bounds; epsg: number; gsd: number } {
  const files: NamedBounds[] = [];
  let gsd: number | null = null;
  let bounds: Bounds | null = null;
  let epsg: number | null = null;
  for (const tiff of tiffs) {
    const firstImage = tiff.getImage(0);
    const imgBounds = Bounds.fromBbox(firstImage.bbox);

    /** Ground sample distance must be the same for all iamgery */
    if (gsd == null) gsd = firstImage.resolution[0];
    else {
      const gsdDiff = Math.abs(gsd - firstImage.resolution[0]);
      if (gsdDiff > GsdFloatingErrorAllowance) {
        throw new Error(`GSD mismatch on imagery ${gsd} vs ${firstImage.resolution[0]} source:` + tiff.source.uri);
      }
    }

    // Validate all EPSG codes are the same for each imagery set
    if (epsg == null) epsg = firstImage.epsg;
    else if (epsg !== firstImage.epsg) {
      throw new Error(`ESPG projection mismatch on imagery ${epsg} vs ${firstImage.epsg} source:` + tiff.source.uri);
    }

    if (bounds == null) bounds = imgBounds;
    else bounds = bounds.union(imgBounds);
    files.push({ name: tiff.source.uri.replace(target, ''), ...imgBounds });
  }
  if (bounds == null) throw new Error('Failed to extract imagery bounds from:' + target);
  if (gsd == null) throw new Error('Failed to extract imagery GSD from:' + target);
  if (epsg == null) throw new Error('Failed to extract imagery epsg from:' + target);

  return { gsd, files, bounds, epsg };
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
  const params = computeTiffParameters(target, tiffs);

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
 * target = "/imagery/invercargill_2022_0.05m/"
 * ```
 *
 * will load all tiffs from the resulting folder into a single tile set `aerial`
 *
 * B: A tree of imagery datasets
 *
 * ```
 * target = "/imagery/"
 * ```
 *
 * will load all tiffs from all folders inside /imagery into a single tile set "aerial",
 * then load each folder into their own tile set
 *
 * tile sets:  aerial, wellington_2022_0.05, invercargill_2022_0.05m
 *
 * @param provider where to store all the configuration generated
 * @param target the target location
 * @param concurrency number of tiff files to load at a time
 * @returns
 */
export async function initConfigFromPath(
  provider: ConfigProviderMemory,
  target: string,
  concurrency = 25,
): Promise<{ tileSet: ConfigTileSetRaster; imagery: ConfigImagery[] }> {
  const q = pLimit(concurrency);
  // TODO listing the entire folder to see if it contains a tiff seems expensive, for local folders this should be pretty quick though
  const targets = await fsa.toArray(fsa.details(target, { recursive: false }));
  const imageryConfig: Promise<ConfigImagery>[] = [];

  // Folder is a folder of tiffs
  const hasTiff = targets.find((f) => isTiff(f.path));
  if (hasTiff) imageryConfig.push(imageryFromTiffPath(target, q));
  else {
    for (const cfg of targets) {
      if (cfg.isDirectory) imageryConfig.push(imageryFromTiffPath(cfg.path, q));
    }
  }

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

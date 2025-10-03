import {
  BaseConfig,
  ConfigBundled,
  ConfigId,
  ConfigImagery,
  ConfigImageryOverview,
  ConfigLayer,
  ConfigPrefix,
  ConfigProvider,
  ConfigProviderMemory,
  ConfigTileSet,
  ConfigVectorStyle,
  sha256base58,
  StyleJson,
  TileSetType,
} from '@basemaps/config';
import { ImageFormat, TileMatrixSet, TileMatrixSets, VectorFormat } from '@basemaps/geo';
import { Cotar, fsa, stringToUrlFolder, Tiff, TiffTag } from '@basemaps/shared';
import { LimitFunction } from 'p-limit';
import ulid from 'ulid';

import { LogType } from './log.js';
import { zProviderConfig } from './parse.provider.js';
import { zStyleJson } from './parse.style.js';
import { TileSetConfigSchemaLayer, zTileSetConfig } from './parse.tile.set.js';
import { ConfigImageryTiff, initImageryFromTiffUrl } from './tiff.config.js';

export function matchUri(a: string, b: string): boolean {
  const UrlA = new URL(a.endsWith('/') ? a : a + '/');
  const UrlB = new URL(b.endsWith('/') ? b : b + '/');
  if (UrlA.href === UrlB.href) return true;
  return false;
}

export function guessIdFromUri(uri: string): string | null {
  const parts = uri.split('/');
  const id = uri.endsWith('/') ? parts.at(-2) : parts.at(-1);

  if (id == null) return null;
  try {
    const date = new Date(ulid.decodeTime(id));
    if (date.getUTCFullYear() < 2015) return null;
    if (date.getUTCFullYear() > new Date().getUTCFullYear() + 1) return null;
    return id;
  } catch (e) {
    return null;
  }
}

const IsEmptyCheckSizeBytes = 512 * 1024;
/**
 * Check to see if this tiff has any data
 *
 * This looks at tiff tile offset arrays see if any internal tiff tiles contain any data
 *
 * @param toCheck Path or tiff check
 * @returns true if the tiff is empty, false otherwise
 */
export async function isEmptyTiff(toCheck: URL | Tiff): Promise<boolean> {
  const isUrl = toCheck instanceof URL;
  const tiff = isUrl ? await Tiff.create(fsa.source(toCheck)) : toCheck;

  try {
    // Only check the tiff for empty if the size is less than IsEmptyCheckSizeBytes
    const tiffSize = tiff.source.metadata?.size ?? 0;
    if (tiffSize > IsEmptyCheckSizeBytes) return false;

    // Starting the smallest tiff overview greatly reduces the amount of data needing to be read
    // if the tiff contains data.
    for (let i = tiff.images.length - 1; i >= 0; i--) {
      const tileOffsets = await tiff.images[i].fetch(TiffTag.TileByteCounts);
      // Tiff is not tiled, so cannot know if its empty from tile offsets
      if (tileOffsets == null) return false;
      // If any tile offset is above 0 then there is data at that offset.
      for (const offset of tileOffsets) {
        // There exists a tile that contains some data, so this tiff is not empty
        if (offset > 0) return false;
      }
    }
    return true;
  } finally {
    // If the tiff was created here, it needs to be closed
    if (isUrl) await tiff.source.close?.();
  }
}

export class ConfigJson {
  mem: ConfigProviderMemory;
  url: URL;
  cache: Map<string, Promise<ConfigImagery>> = new Map();
  logger: LogType;
  Q: LimitFunction;
  imageryConfigCache?: URL;

  constructor(url: URL, Q: LimitFunction, log: LogType, imageryConfigCache?: URL) {
    this.url = url;
    this.mem = new ConfigProviderMemory();
    this.imageryConfigCache = imageryConfigCache;
    this.logger = log;
    this.Q = Q;
  }

  /** Import configuration from a base path */
  static async fromUrl(
    basePath: URL,
    Q: LimitFunction,
    log: LogType,
    imageryConfigCache?: URL,
  ): Promise<ConfigProviderMemory> {
    if (basePath.pathname.endsWith('.json') || basePath.pathname.endsWith('.json.gz')) {
      const config = await fsa.readJson<BaseConfig>(basePath);
      if (config.id && config.id.startsWith('cb_')) {
        // We have been given a config bundle just load that instead!
        return ConfigProviderMemory.fromJson(config as unknown as ConfigBundled);
      }
    }

    const cfg = new ConfigJson(basePath, Q, log, imageryConfigCache);

    const files = await fsa.toArray(fsa.list(basePath));

    const todo = files.map(async (filePath) => {
      if (!filePath.pathname.endsWith('.json')) return;
      const bc: BaseConfig = await fsa.readJson<BaseConfig>(filePath);
      const prefix = ConfigId.getPrefix(bc.id);
      if (prefix) {
        log.debug({ path: filePath, type: prefix, config: bc.id }, 'Config:Load');
        switch (prefix) {
          case ConfigPrefix.TileSet:
            cfg.mem.put(await cfg.tileSet(bc));
            break;
          case ConfigPrefix.Provider:
            cfg.mem.put(await cfg.provider(bc));
            break;
          case ConfigPrefix.Style:
            cfg.mem.put(await cfg.style(bc));
            break;
        }
      } else {
        log.warn({ path: filePath }, 'Config:Invalid');
      }
    });

    await Promise.all(todo);

    return cfg.mem;
  }

  provider(obj: unknown): Promise<ConfigProvider> {
    const pv = zProviderConfig.parse(obj);
    this.logger.info({ config: pv.id }, 'Config:Loaded:Provider');

    return Promise.resolve({
      id: pv.id,
      name: ConfigId.unprefix(ConfigPrefix.Provider, pv.id),
      serviceIdentification: pv.serviceIdentification,
      serviceProvider: pv.serviceProvider,
      updatedAt: Date.now(),
      version: 1,
    });
  }

  style(obj: unknown): Promise<ConfigVectorStyle> {
    const st = zStyleJson.parse(obj);
    this.logger.info({ config: st.id }, 'Config:Loaded:Style');

    return Promise.resolve({
      id: st.id,
      name: st.name,
      style: st as StyleJson,
      updatedAt: Date.now(),
    });
  }

  async tileSet(obj: unknown): Promise<ConfigTileSet> {
    const ts = zTileSetConfig.parse(obj);
    this.logger.info({ config: ts.id }, 'Config:Loaded:TileSet');

    const imageryFetch: Promise<ConfigImagery>[] = [];
    if (ts.type === TileSetType.Raster) {
      for (const layer of ts.layers) {
        const category = layer.category ?? ts.category ?? undefined;
        if (layer[2193] != null) {
          imageryFetch.push(this.loadImagery(stringToUrlFolder(layer[2193]), layer.name, layer.title, category));
        }

        if (layer[3857] != null) {
          imageryFetch.push(this.loadImagery(stringToUrlFolder(layer[3857]), layer.name, layer.title, category));
        }
      }
    }

    const imagery = await Promise.all(imageryFetch);

    const layers: ConfigLayer[] = [];
    const tileSet: Partial<ConfigTileSet> = {
      type: ts.type,
      id: ts.id,
      name: ConfigId.unprefix(ConfigPrefix.TileSet, ts.id),
      title: ts.title,
      layers,
    };
    function updateLayerUri(
      layer: TileSetConfigSchemaLayer,
      uri: string | undefined,
      logger: LogType,
    ): string | undefined {
      if (uri == null) return uri;
      if (uri.startsWith(ConfigPrefix.Imagery)) return uri;
      const record = imagery.find((f) => matchUri(f.uri, uri)); ///
      if (record == null) throw new Error('Unable to find imagery id for uri:' + uri);

      if (record.title && record.title !== layer.title) {
        logger.warn(
          { layer: layer.name, imageryTitle: record.title, layerTitle: layer.title },
          'Imagery:Title:Missmatch',
        );
      }
      record.title = layer.title;

      if (layer.category) {
        if (record.category && record.category !== layer.category) {
          logger.warn(
            { layer: layer.name, imageryCategory: record.category, layerCategory: layer.category },
            'Imagery:Category:Missmatch',
          );
        }
        record.category = layer.category;
      }

      return record.id;
    }

    // Map the configuration sources into imagery ids
    for (const l of ts.layers) {
      const layer = { ...l };
      layers.push(layer);

      if (tileSet.type === TileSetType.Raster) {
        if (layer[2193]) layer[2193] = updateLayerUri(layer, layer[2193], this.logger);
        if (layer[3857]) layer[3857] = updateLayerUri(layer, layer[3857], this.logger);
      }
    }
    if (ts.description) tileSet.description = ts.description;
    if (ts.category) tileSet.category = ts.category;
    if (ts.minZoom) tileSet.minZoom = ts.minZoom;
    if (ts.maxZoom) tileSet.maxZoom = ts.maxZoom;
    if (tileSet.type === TileSetType.Raster) {
      if (ts.outputs) tileSet.outputs = ts.outputs;
      if (ts.background) tileSet.background = ts.background;
    }

    if (ts.format) {
      tileSet.format = ts.format as ImageFormat | VectorFormat;
    } else {
      tileSet.format = ts.type === TileSetType.Vector ? 'pbf' : 'webp';
    }

    tileSet.aliases = ts.aliases;

    return tileSet as ConfigTileSet;
  }

  loadImagery(url: URL, name: string, title: string, category?: string): Promise<ConfigImagery> {
    let existing = this.cache.get(url.href);
    if (existing == null) {
      existing = this._loadImagery(url, name, title, category);
      this.cache.set(url.href, existing);
    }
    return existing;
  }

  /** Exposed for testing */
  initImageryFromTiffUrl(url: URL): Promise<ConfigImageryTiff> {
    return initImageryFromTiffUrl(url, this.Q, this.imageryConfigCache, this.logger);
  }

  async _loadImagery(url: URL, name: string, title: string, category?: string): Promise<ConfigImagery> {
    // TODO is there a better way of guessing the imagery id & tile matrix?
    const imageId = guessIdFromUri(url.href) ?? sha256base58(url.href);
    const id = ConfigId.prefix(ConfigPrefix.Imagery, imageId);
    this.logger.trace({ url: url.href, imageId: id }, 'Imagery:Fetch');

    const img = await this.initImageryFromTiffUrl(url);
    img.id = id; // TODO could we use img.collection.id for this?

    // TODO should we be overwriting the name and title when it is loaded from the STAC metadata?
    img.name = name;
    img.title = title;
    img.category = category;

    // TODO should we store the STAC collection somewhere?
    delete img.collection;
    this.mem.put(img);
    return img;
  }

  static async findImageryOverviews(cfg: ConfigImagery): Promise<ConfigImageryOverview | undefined> {
    if (cfg.overviews) throw new Error('Overviews exist already for config: ' + cfg.id);

    const targetOverviews = new URL('overviews.tar.co', fsa.toUrl(cfg.uri));
    const exists = await fsa.exists(targetOverviews);
    if (!exists) return;

    const tileMatrix = TileMatrixSets.find(cfg.tileMatrix);
    if (tileMatrix == null) throw new Error('Missing tileMatrix for imagery:' + cfg.id);

    const cotar = await Cotar.fromTar(fsa.source(targetOverviews));

    // When the cotars are made a WMTSCapabilties is added so it easy to view in something like QGIS
    // We can use the WMTSCapabitities to figure out the tileMatrix and zoom levels
    const wmtsRaw = await cotar.get('WMTSCapabilities.xml');
    if (wmtsRaw == null) return;

    const wmts = Buffer.from(wmtsRaw).toString();

    const zoomLevels = zoomLevelsFromWmts(wmts, tileMatrix);
    if (zoomLevels == null) return;

    return { path: 'overviews.tar.co', minZoom: zoomLevels.minZoom, maxZoom: zoomLevels.maxZoom };
  }
}

/** Attempt to parse a cotar WMTSCapabilties to figure out what zoom levels are applicable */
export function zoomLevelsFromWmts(
  wmts: string,
  tileMatrix: TileMatrixSet,
): { minZoom: number; maxZoom: number } | null {
  const owsIds = wmts
    .split('\n')
    .filter((f) => f.includes('ows:Identifier'))
    .map((c) => c.trim().replace('<ows:Identifier>', '').replace('</ows:Identifier>', ''));

  const tileMatrixOffset = owsIds.indexOf(tileMatrix.identifier);
  if (tileMatrixOffset === -1) return null;

  const minZoom = Number(owsIds[tileMatrixOffset + 1]);
  const maxZoom = Number(owsIds[owsIds.length - 1]);

  if (isNaN(minZoom)) return null;
  if (isNaN(maxZoom)) return null;
  if (maxZoom < minZoom) return null;
  if (maxZoom === 0) return null;
  return { minZoom, maxZoom };
}

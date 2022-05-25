import { Bounds, GoogleTms, ImageFormat, Nztm2000QuadTms, TileMatrixSet, VectorFormat } from '@basemaps/geo';
import { fsa } from '@chunkd/fs';
import { basename } from 'path';
import ulid from 'ulid';
import { Config } from '../base.config.js';
import { parseRgba } from '../color.js';
import { ConfigImagery } from '../config/imagery.js';
import { ConfigPrefix } from '../config/prefix.js';
import { ConfigProvider } from '../config/provider.js';
import { ConfigLayer, ConfigTileSet, TileSetType } from '../config/tile.set.js';
import { ConfigVectorStyle, StyleJson } from '../config/vector.style.js';
import { ConfigProviderMemory } from '../memory/memory.config.js';
import { LogType } from './log.js';
import { zProviderConfig } from './parse.provider.js';
import { zStyleJson } from './parse.style.js';
import { zTileSetConfig } from './parse.tile.set.js';

export function guessIdFromUri(uri: string): string {
  const parts = uri.split('/');
  const id = parts.pop();

  if (id == null) throw new Error('Could not get id from URI: ' + uri);
  const date = new Date(ulid.decodeTime(id));
  if (date.getUTCFullYear() < 2015) throw new Error('Could not get id from URI: ' + uri);
  if (date.getUTCFullYear() > new Date().getUTCFullYear() + 1) throw new Error('Could not get id from URI: ' + uri);
  return id;
}

export class ConfigJson {
  mem: ConfigProviderMemory;
  path: string;
  cache: Map<string, Promise<ConfigImagery>> = new Map();
  logger: LogType;

  constructor(path: string, log: LogType) {
    this.path = path;
    this.mem = new ConfigProviderMemory();
    this.logger = log;
  }

  /** Import configuration from a base path */
  static async fromPath(basePath: string, log: LogType): Promise<ConfigJson> {
    const cfg = new ConfigJson(basePath, log);

    for await (const pvPath of fsa.list(fsa.join(basePath, 'provider'))) {
      if (!pvPath.endsWith('.json')) continue;
      const pv = await cfg.provider(await fsa.readJson(pvPath));
      cfg.mem.put(pv);
    }

    for await (const tsPath of fsa.list(fsa.join(basePath, 'tileset'))) {
      if (!tsPath.endsWith('.json')) continue;
      const ts = await cfg.tileSet(await fsa.readJson(tsPath));
      cfg.mem.put(ts);
    }

    for await (const stylePath of fsa.list(fsa.join(basePath, 'style'))) {
      if (!stylePath.endsWith('.json')) continue;
      const ts = await cfg.style(await fsa.readJson(stylePath));
      cfg.mem.put(ts);
    }

    return cfg;
  }

  async provider(obj: unknown): Promise<ConfigProvider> {
    const pv = zProviderConfig.parse(obj);

    const provider: ConfigProvider = {
      id: pv.id,
      name: Config.unprefix(ConfigPrefix.Provider, pv.id),
      serviceIdentification: pv.serviceIdentification,
      serviceProvider: pv.serviceProvider,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    };
    return provider;
  }

  async style(obj: unknown): Promise<ConfigVectorStyle> {
    const st = zStyleJson.parse(obj);
    return {
      id: st.id,
      name: st.name,
      style: st as StyleJson,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  async tileSet(obj: unknown): Promise<ConfigTileSet> {
    const ts = zTileSetConfig.parse(obj);

    const imageryFetch: Promise<ConfigImagery>[] = [];
    if (ts.type === TileSetType.Raster) {
      for (const layer of ts.layers) {
        if (layer[2193] != null && layer[2193].startsWith('s3://')) {
          imageryFetch.push(this.loadImagery(layer[2193], Nztm2000QuadTms, layer.name));
        }

        if (layer[3857] != null && layer[3857].startsWith('s3://')) {
          imageryFetch.push(this.loadImagery(layer[3857], GoogleTms, layer.name));
        }
      }
    }

    const imagery = await Promise.all(imageryFetch);

    const layers: ConfigLayer[] = [];
    const tileSet: Partial<ConfigTileSet> = {
      type: ts.type,
      id: ts.id,
      name: Config.unprefix(Config.TileSet.prefix, ts.id),
      layers,
    };
    function updateLayerUri(uri: string | undefined): string | undefined {
      if (uri == null) return uri;
      if (uri.startsWith(ConfigPrefix.Imagery)) return uri;
      const record = imagery.find((f) => f.uri === uri)?.id; ///
      if (record == null) throw new Error('Unable to find imagery id for uri:' + uri);
      return record;
    }

    // Map the configuration sources into imagery ids
    for (const l of ts.layers) {
      const layer = { ...l };
      layers.push(layer);

      if (tileSet.type === TileSetType.Raster) {
        if (layer[2193]) layer[2193] = updateLayerUri(layer[2193]);
        if (layer[3857]) layer[3857] = updateLayerUri(layer[3857]);
      }
    }
    if (ts.title) tileSet.title = ts.title;
    if (ts.description) tileSet.description = ts.description;
    if (ts.minZoom) tileSet.minZoom = ts.minZoom;
    if (ts.maxZoom) tileSet.maxZoom = ts.maxZoom;
    if (ts.background && tileSet.type === TileSetType.Raster) {
      tileSet.background = parseRgba(ts.background);
    }

    if (ts.format) {
      tileSet.format = ts.format as ImageFormat | VectorFormat;
    } else {
      tileSet.format = ts.type === TileSetType.Vector ? VectorFormat.MapboxVectorTiles : ImageFormat.Webp;
    }

    return tileSet as ConfigTileSet;
  }

  loadImagery(path: string, tileMatrix: TileMatrixSet, name: string): Promise<ConfigImagery> {
    let existing = this.cache.get(path);
    if (existing == null) {
      existing = this._loadImagery(path, tileMatrix, name);
      this.cache.set(path, existing);
    }
    return existing;
  }

  async _loadImagery(uri: string, tileMatrix: TileMatrixSet, name: string): Promise<ConfigImagery> {
    this.logger.trace({ uri }, 'FetchImagery');

    // TODO is there a better way of guessing the imagery id & tile matrix?
    const id = Config.prefix(ConfigPrefix.Imagery, guessIdFromUri(uri));

    const fileList = await fsa.toArray(fsa.list(uri));
    const tiffFiles = fileList.filter((f) => f.endsWith('.tiff'));

    let bounds: Bounds | null = null;
    // Files are stored as `{z}-{x}-{y}.tiff`
    const files = tiffFiles.map((c) => {
      const tileName = basename(c).replace('.tiff', '');
      const [z, x, y] = tileName.split('-').map((f) => Number(f));
      if (isNaN(z) || isNaN(y) || isNaN(z)) throw new Error('Failed to parse XYZ from: ' + c);

      const tile = tileMatrix.tileToSourceBounds({ z, x, y });
      // Expand the total bounds to cover this tile
      if (bounds == null) bounds = Bounds.fromJson(tile);
      else bounds = bounds.union(Bounds.fromJson(tile));
      return { ...tile, name: tileName };
    });

    // Sort the files by Z, X, Y
    files.sort((a, b): number => {
      const widthSize = a.width - b.width;
      if (widthSize !== 0) return widthSize;

      const aXyz = a.name.split('-').map((f) => Number(f));
      const bXyz = b.name.split('-').map((f) => Number(f));

      const zDiff = aXyz[0] - bXyz[0];
      if (zDiff !== 0) return zDiff;

      const xDiff = aXyz[1] - bXyz[1];
      if (xDiff !== 0) return xDiff;

      return bXyz[2] - aXyz[2];
    });

    this.logger.debug({ uri, files: files.length }, 'FetchImagery:Done');

    if (bounds == null) throw new Error('Failed to get bounds from URI: ' + uri);
    const now = Date.now();
    const output: ConfigImagery = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      projection: tileMatrix.projection.code,
      tileMatrix: tileMatrix.identifier,
      uri,
      bounds,
      files,
    };
    this.mem.put(output);
    // Ensure there is also a tile set for each imagery set
    // this.mem.put(ConfigJson.imageryToTileSet(output));
    return output;
  }
}

import {
  ConfigImagery,
  ConfigLayer,
  ConfigTileSetRaster,
  TileSetNameComponents,
  TileSetNameParser,
  TileSetType,
} from '@basemaps/config';
import { Bounds, Epsg, ImageFormat, Tile, TileMatrixSet, TileMatrixSets, VectorFormat } from '@basemaps/geo';
import { Config, Env, fsa, LogType, TileDataXyz, titleizeImageryName } from '@basemaps/shared';
import { Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import { CogTiff } from '@cogeotiff/core';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { Metrics } from '@linzjs/metrics';
import pLimit from 'p-limit';
import { NotFound, NotModified } from './routes/response.js';
import { TileEtag } from './routes/tile.etag.js';
import { St } from './source.tracer.js';
import { TiffCache } from './tiff.cache.js';
import { TileSets } from './tile.set.cache.js';

const LoadingQueue = pLimit(Env.getNumber(Env.TiffConcurrency, 25));

export const TileComposer = new TileMakerSharp(256);

export interface TileSetResponse {
  buffer: Buffer;
  metrics: Metrics;
  layersUsed: number;
  layersTotal: number;
  contentType: string;
}

const DefaultResizeKernel = { in: 'lanczos3', out: 'lanczos3' } as const;
const DefaultBackground = { r: 0, g: 0, b: 0, alpha: 0 };

export function getTiffName(name: string): string {
  if (name.endsWith('.tif') || name.endsWith('.tiff')) return name;
  return `${name}.tiff`;
}

export class TileSetRaster {
  type: TileSetType.Raster = TileSetType.Raster;

  tileMatrix: TileMatrixSet;
  tiler: Tiler;
  imagery: Map<string, ConfigImagery>;
  extentOverride: Bounds;

  components: TileSetNameComponents;
  tileSet: ConfigTileSetRaster;

  constructor(name: string, tileMatrix: TileMatrixSet) {
    this.components = TileSetNameParser.parse(name);
    this.tileMatrix = tileMatrix;
    this.tiler = new Tiler(this.tileMatrix);
  }

  get id(): string {
    return TileSets.id(this.fullName, this.tileMatrix);
  }

  get fullName(): string {
    return TileSetNameParser.componentsToName(this.components);
  }

  get title(): string {
    return this.tileSet?.title ?? this.components.name;
  }

  get description(): string {
    return this.tileSet?.description ?? '';
  }

  get extent(): Bounds {
    return this.extentOverride ?? this.tileMatrix.extent;
  }

  /** Preferred default imagery format */
  get format(): ImageFormat {
    return this.tileSet.format ?? ImageFormat.Webp;
  }

  async init(record: ConfigTileSetRaster): Promise<void> {
    this.tileSet = record;
    this.imagery = await Config.getAllImagery(this.tileSet.layers, [this.tileMatrix.projection]);
  }

  async initTiffs(tile: Tile, log: LogType): Promise<CogTiff[]> {
    const tiffs = this.getTiffsForTile(tile, log);
    let failed = false;
    // Remove any tiffs that failed to load
    const promises = tiffs.map((c) => {
      return LoadingQueue(async () => {
        try {
          await c.init();
        } catch (error) {
          log.warn({ error, tiff: c.source.uri }, 'TiffLoadFailed');
          failed = true;
        }
      });
    });
    await Promise.all(promises);
    if (failed) return tiffs.filter((f) => f.images.length > 0);
    return tiffs;
  }

  public async tile(req: LambdaHttpRequest, xyz: TileDataXyz): Promise<LambdaHttpResponse> {
    if (xyz.ext === VectorFormat.MapboxVectorTiles) return NotFound;
    const tiffs = await this.initTiffs(xyz, req.log);
    const layers = await this.tiler.tile(tiffs, xyz.x, xyz.y, xyz.z);

    // Generate a unique hash given the full URI, the layers used and a renderId
    const cacheKey = TileEtag.generate(layers, xyz);
    req.set('layers', layers.length);
    if (TileEtag.isNotModified(req, cacheKey)) return NotModified;

    const res = await TileComposer.compose({
      layers,
      format: xyz.ext,
      background: this.tileSet.background ?? DefaultBackground,
      resizeKernel: this.tileSet.resizeKernel ?? DefaultResizeKernel,
      metrics: req.timer,
    });

    req.set('layersUsed', res.layers);
    req.set('bytes', res.buffer.byteLength);

    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'public, max-age=604800');
    response.buffer(res.buffer, 'image/' + xyz.ext);
    return response;
  }

  /**
   * Get a list of tiffs in the rendering order that is needed to render the tile
   * @param tms tile matrix set to describe the tiling scheme
   * @param tile tile to render
   */
  public getTiffsForTile(tile: Tile, log?: LogType): CogTiff[] {
    const output: CogTiff[] = [];
    const tileBounds = this.tileMatrix.tileToSourceBounds(tile);

    // All zoom level config is stored as Google zoom levels
    const filterZoom = TileMatrixSet.convertZoomLevel(tile.z, this.tileMatrix, TileMatrixSets.get(Epsg.Google));
    for (const layer of this.tileSet.layers) {
      if (layer.maxZoom != null && filterZoom > layer.maxZoom) continue;
      if (layer.minZoom != null && filterZoom < layer.minZoom) continue;

      const imgId = layer[this.tileMatrix.projection.code];
      if (imgId == null) {
        log?.warn({ layer: layer.name, projection: this.tileMatrix.projection.code }, 'Failed to lookup imagery');
        continue;
      }

      const imagery = this.imagery.get(imgId);
      if (imagery == null) {
        log?.warn(
          { layer: layer.name, projection: this.tileMatrix.projection.code, imgId },
          'Failed to lookup imagery',
        );
        continue;
      }
      if (!tileBounds.intersects(Bounds.fromJson(imagery.bounds))) continue;

      for (const tiff of this.getCogsForTile(imagery, tileBounds)) output.push(tiff);
    }
    return output;
  }

  private getCogsForTile(record: ConfigImagery, tileBounds: Bounds): CogTiff[] {
    const output: CogTiff[] = [];
    for (const c of record.files) {
      if (!tileBounds.intersects(Bounds.fromJson(c))) continue;
      const tiffPath = fsa.join(record.uri, getTiffName(c.name));

      let existing = TiffCache.get(tiffPath);
      if (existing == null) {
        const source = fsa.source(tiffPath);
        if (source == null) {
          throw new Error(`Failed to create CogSource from  ${tiffPath}`);
        }

        St.trace(source);
        existing = new CogTiff(source);
        TiffCache.set(tiffPath, existing);
      }

      output.push(existing);
    }

    return output;
  }

  /** Look up imagery by imageryId or by image name */
  findImagery(imgId: string): ConfigImagery | null {
    const existing = this.imagery.get(imgId);
    if (existing != null) return existing;
    for (const img of this.imagery.values()) {
      if (img.name === imgId) return img;
    }
    return null;
  }

  child(imgId: string): TileSetRaster | null {
    const image = this.findImagery(imgId);
    if (image == null) return null;
    const childName = TileSetNameParser.componentsToName({ ...this.components, layer: image.name });
    const child = new TileSetRaster(childName, this.tileMatrix);
    // use parent data as prototype for child;
    child.tileSet = { ...this.tileSet };
    child.tileSet.background = undefined;
    const title = this.tileSet?.title ?? this.tileSet?.name;
    child.tileSet.title = image.title ?? `${title} ${titleizeImageryName(image.name)}`;
    child.extentOverride = Bounds.fromJson(image.bounds);

    if (image.category) child.tileSet.category = image.category;

    const layer: ConfigLayer = { name: image.name, minZoom: 0, maxZoom: 100 };
    layer[this.tileMatrix.projection.code] = image.id;

    child.tileSet.layers = [layer];
    child.imagery = new Map();
    child.imagery.set(image.id, image);

    return child;
  }
}

import { ConfigImagery, ConfigLayer, ConfigTileSetRaster, TileSetNameParser, TileSetType } from '@basemaps/config';
import { Bounds, Epsg, Tile, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { Config, Env, fsa, LogType, TileDataXyz, titleizeImageryName, VectorFormat } from '@basemaps/shared';
import { Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import { CogTiff } from '@cogeotiff/core';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import { Metrics } from '@linzjs/metrics';
import pLimit from 'p-limit';
import { NotFound, NotModified } from './routes/response.js';
import { TileEtag } from './routes/tile.etag.js';
import { TiffCache } from './tiff.cache.js';
import { TileSetHandler } from './tile.set.js';

const LoadingQueue = pLimit(Env.getNumber(Env.TiffConcurrency, 5));

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

export class TileSetRaster extends TileSetHandler<ConfigTileSetRaster> {
  type = TileSetType.Raster;

  tileMatrix: TileMatrixSet;
  tiler: Tiler;
  imagery: Map<string, ConfigImagery>;
  extentOverride: Bounds;

  /**
   * Return the location of a imagery `record`
   * @param record
   * @param name the COG to locate. Return just the directory if `null`
   */
  static basePath(record: ConfigImagery, name?: string): string {
    if (name == null) return record.uri;
    if (record.uri.endsWith('/')) throw new Error("Invalid uri ending with '/' " + record.uri);
    return `${record.uri}/${name}.tiff`;
  }

  constructor(name: string, tileMatrix: TileMatrixSet) {
    super(name, tileMatrix);
    this.tiler = new Tiler(this.tileMatrix);
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

  async init(record: ConfigTileSetRaster): Promise<void> {
    this.tileSet = record;
    this.imagery = await Config.getAllImagery(this.tileSet.layers, this.tileMatrix.projection);
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

    req.timer.start('tile:compose');
    const res = await TileComposer.compose({
      layers,
      format: xyz.ext,
      background: this.tileSet.background ?? DefaultBackground,
      resizeKernel: this.tileSet.resizeKernel ?? DefaultResizeKernel,
    });
    req.timer.end('tile:compose');

    req.set('layersUsed', res.layers);
    req.set('allLayersUsed', res.layers === layers.length);
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

      const imgId = Config.getImageId(layer, this.tileMatrix.projection);
      if (imgId == null) {
        log?.warn({ layer: layer.name, projection: this.tileMatrix.projection.code }, 'Failed to lookup imagery');
        continue;
      }

      const imagery = this.imagery.get(imgId);
      if (imagery == null) {
        console.log('Failed', { imagery, i: this.imagery, ts: this.tileSet.layers });
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

      const tiffKey = `${record.id}_${c.name}`;
      let existing = TiffCache.get(tiffKey);
      if (existing == null) {
        const source = fsa.source(TileSetRaster.basePath(record, c.name));
        if (source == null) {
          throw new Error(`Failed to create CogSource from  ${TileSetRaster.basePath(record, c.name)}`);
        }
        existing = new CogTiff(source);
        TiffCache.set(tiffKey, existing);
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

  child(imgId: string): TileSetRaster {
    const image = this.findImagery(imgId);
    if (image == null) {
      throw new Error('Failed to create child tile set ' + this.fullName + ' Missing imagery ' + imgId);
    }
    const childName = TileSetNameParser.componentsToName({ ...this.components, layer: image.name });
    const child = new TileSetRaster(childName, this.tileMatrix);
    // use parent data as prototype for child;
    child.tileSet = { ...this.tileSet };
    child.tileSet.background = undefined;
    const title = this.tileSet?.title ?? this.tileSet?.name;
    child.tileSet.title = `${title} ${titleizeImageryName(image.name)}`;
    child.extentOverride = Bounds.fromJson(image.bounds);

    const layer: ConfigLayer = { name: image.name, minZoom: 0, maxZoom: 100 };
    layer[this.tileMatrix.projection.code] = image.id;

    child.tileSet.layers = [layer];
    child.imagery = new Map();
    child.imagery.set(image.id, image);

    return child;
  }
}

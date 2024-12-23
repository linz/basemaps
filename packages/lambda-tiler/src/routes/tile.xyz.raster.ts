import { ConfigTileSetRaster, getAllImagery } from '@basemaps/config';
import { Bounds, Epsg, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { Cotar, Env, stringToUrlFolder, Tiff } from '@basemaps/shared';
import { getImageFormat, Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import pLimit from 'p-limit';

import { ConfigLoader } from '../util/config.loader.js';
import { Etag } from '../util/etag.js';
import { NotFound, NotModified } from '../util/response.js';
import { CoSources } from '../util/source.cache.js';
import { TileXyz, Validate } from '../util/validate.js';

const LoadingQueue = pLimit(Env.getNumber(Env.TiffConcurrency, 25));

export function getTiffName(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith('.tif') || lowerName.endsWith('.tiff')) return name;
  return `${name}.tiff`;
}

export type CloudArchive = Tiff | Cotar;

/** Check to see if a cloud archive is a Tiff or a Cotar */
export function isArchiveTiff(x: CloudArchive): x is Tiff {
  if (x instanceof Tiff) return true;
  if (x.source.url.pathname.endsWith('.tiff')) return true;
  if (x.source.url.pathname.endsWith('.tif')) return true;
  return false;
}

export const TileComposer256 = new TileMakerSharp(256);
export const TileComposer512 = new TileMakerSharp(512);

export const DefaultResizeKernel = { in: 'lanczos3', out: 'lanczos3' } as const;
export const DefaultBackground = { r: 0, g: 0, b: 0, alpha: 0 };

export const TileXyzRaster = {
  async getAssetsForBounds(
    req: LambdaHttpRequest,
    tileSet: ConfigTileSetRaster,
    tileMatrix: TileMatrixSet,
    bounds: Bounds,
    zoom: number,
    ignoreOverview = false,
  ): Promise<URL[]> {
    const config = await ConfigLoader.load(req);
    const imagery = await getAllImagery(config, tileSet.layers, [tileMatrix.projection]);

    const output: URL[] = [];

    // All zoom level config is stored as Google zoom levels
    const filterZoom = TileMatrixSet.convertZoomLevel(zoom, tileMatrix, TileMatrixSets.get(Epsg.Google));
    for (const layer of tileSet.layers) {
      if (layer.maxZoom != null && filterZoom > layer.maxZoom) continue;
      if (layer.minZoom != null && filterZoom < layer.minZoom) continue;

      const imgId = layer[tileMatrix.projection.code];
      // Imagery does not exist for this projection
      if (imgId == null) continue;

      const img = imagery.get(imgId);
      if (img == null) {
        req.log.warn({ layer: layer.name, projection: tileMatrix.projection.code, imgId }, 'Failed to lookup imagery');
        continue;
      }
      if (!bounds.intersects(Bounds.fromJson(img.bounds))) continue;

      const imgUrl = stringToUrlFolder(img.uri);
      for (const c of img.files) {
        if (!bounds.intersects(Bounds.fromJson(c))) continue;

        // If there are overviews and they exist for this zoom range and we are not ignoring them
        // lets use the overviews instead!
        if (
          img.overviews &&
          img.overviews.maxZoom >= filterZoom &&
          img.overviews.minZoom <= filterZoom &&
          ignoreOverview !== true
        ) {
          output.push(new URL(img.overviews.path, imgUrl));
          break;
        }

        const tiffPath = new URL(getTiffName(c.name), imgUrl);
        output.push(tiffPath);
      }
    }
    return output;
  },

  async loadAssets(req: LambdaHttpRequest, assets: URL[]): Promise<CloudArchive[]> {
    const toLoad: Promise<CloudArchive | null>[] = [];
    for (const assetPath of assets) {
      toLoad.push(
        LoadingQueue((): Promise<CloudArchive | null> => {
          if (assetPath.pathname.endsWith('.tar.co')) {
            return CoSources.getCotar(assetPath).catch((err: unknown) => {
              req.log.warn({ err, tiff: assetPath }, 'Load:Cotar:Failed');
              return null;
            });
          }
          return CoSources.getCog(assetPath).catch((err: unknown) => {
            req.log.warn({ err, tiff: assetPath }, 'Load:Tiff:Failed');
            return null;
          });
        }),
      );
    }

    // Remove with typescript >=5.5.0
    return (await Promise.all(toLoad)).filter((f) => f != null);
  },

  async getAssetsForTile(req: LambdaHttpRequest, tileSet: ConfigTileSetRaster, xyz: TileXyz): Promise<URL[]> {
    const tileBounds = xyz.tileMatrix.tileToSourceBounds(xyz.tile);
    return TileXyzRaster.getAssetsForBounds(req, tileSet, xyz.tileMatrix, tileBounds, xyz.tile.z);
  },

  /**
   * Lookup a tile composer based off the provided scale
   *
   * @param scale tile scale generally undefined or 2
   * @returns
   */
  getComposer(scale?: number): TileMakerSharp {
    if (scale === 2) return TileComposer512;
    return TileComposer256;
  },

  async tile(req: LambdaHttpRequest, tileSet: ConfigTileSetRaster, xyz: TileXyz): Promise<LambdaHttpResponse> {
    const tileOutput = Validate.pipeline(tileSet, xyz.tileType, xyz.pipeline);
    if (tileOutput == null) return NotFound();
    req.set('pipeline', tileOutput.name);

    const assetPaths = await this.getAssetsForTile(req, tileSet, xyz);
    const cacheKey = Etag.key(assetPaths);
    if (Etag.isNotModified(req, cacheKey)) return NotModified();

    const assets = await TileXyzRaster.loadAssets(req, assetPaths);

    const tiler = new Tiler(xyz.tileMatrix, xyz.scale);
    const layers = tiler.tile(assets, xyz.tile.x, xyz.tile.y, xyz.tile.z);

    const format = getImageFormat(xyz.tileType);
    if (format == null) return new LambdaHttpResponse(400, 'Invalid image format: ' + xyz.tileType);

    const res = await this.getComposer(xyz.scale).compose({
      layers,
      pipeline: tileOutput.pipeline,
      format,
      background: tileOutput.background ?? tileSet.background ?? DefaultBackground,
      resizeKernel: tileOutput.resizeKernel ?? tileSet.resizeKernel ?? DefaultResizeKernel,
      metrics: req.timer,
      log: req.log,
    });

    req.set('layersUsed', res.layers);
    req.set('bytes', res.buffer.byteLength);

    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
    response.buffer(res.buffer, `image/${format}`);
    return response;
  },
};

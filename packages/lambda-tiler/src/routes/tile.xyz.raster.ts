import { ConfigTileSetRaster, ConfigTileSetRasterOutput, getAllImagery } from '@basemaps/config';
import { Bounds, Epsg, TileMatrixSet, TileMatrixSets } from '@basemaps/geo';
import { Cotar, Env, stringToUrlFolder, Tiff } from '@basemaps/shared';
import { getImageFormat, Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import pLimit from 'p-limit';

import { ConfigLoader } from '../util/config.loader.js';
import { Etag } from '../util/etag.js';
import { filterLayers } from '../util/filter.js';
import { NotFound, NotModified } from '../util/response.js';
import { CoSources } from '../util/source.cache.js';
import { TileXyz } from '../util/validate.js';

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

export const TileComposer = new TileMakerSharp(256);

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
    const filteredLayers = filterLayers(req, tileSet.layers);

    const output: URL[] = [];

    // All zoom level config is stored as Google zoom levels
    const filterZoom = TileMatrixSet.convertZoomLevel(zoom, tileMatrix, TileMatrixSets.get(Epsg.Google));
    for (const layer of filteredLayers) {
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
            return CoSources.getCotar(assetPath).catch((error) => {
              req.log.warn({ error, tiff: assetPath }, 'Load:Cotar:Failed');
              return null;
            });
          }
          return CoSources.getCog(assetPath).catch((error) => {
            req.log.warn({ error, tiff: assetPath }, 'Load:Tiff:Failed');
            return null;
          });
        }),
      );
    }

    return (await Promise.all(toLoad)).filter((f) => f != null) as CloudArchive[];
  },

  async getAssetsForTile(req: LambdaHttpRequest, tileSet: ConfigTileSetRaster, xyz: TileXyz): Promise<URL[]> {
    const tileBounds = xyz.tileMatrix.tileToSourceBounds(xyz.tile);
    return TileXyzRaster.getAssetsForBounds(req, tileSet, xyz.tileMatrix, tileBounds, xyz.tile.z);
  },

  async tile(req: LambdaHttpRequest, tileSet: ConfigTileSetRaster, xyz: TileXyz): Promise<LambdaHttpResponse> {
    const tileOutput = getTileSetOutput(tileSet, xyz.tileType);
    if (tileOutput == null) return NotFound();

    const assetPaths = await this.getAssetsForTile(req, tileSet, xyz);
    const cacheKey = Etag.key(assetPaths);
    if (Etag.isNotModified(req, cacheKey)) return NotModified();

    const assets = await TileXyzRaster.loadAssets(req, assetPaths);

    const tiler = new Tiler(xyz.tileMatrix);
    const layers = await tiler.tile(assets, xyz.tile.x, xyz.tile.y, xyz.tile.z);

    const res = await TileComposer.compose({
      layers,
      output: tileOutput,
      background: tileOutput.output.background ?? tileSet.background ?? DefaultBackground,
      resizeKernel: tileSet.resizeKernel ?? DefaultResizeKernel,
      metrics: req.timer,
    });

    req.set('layersUsed', res.layers);
    req.set('bytes', res.buffer.byteLength);

    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
    response.buffer(res.buffer, 'image/' + tileOutput.output.type);
    return response;
  },
};

/**
 * Lookup the raster configuration pipeline for a output tile type
 *
 * Defaults to standard image format output if no outputs are defined on the tileset
 */
export function getTileSetOutput(tileSet: ConfigTileSetRaster, tileType?: string): ConfigTileSetRasterOutput | null {
  if (tileSet.outputs != null) {
    // Default to the first output if no extension given
    if (tileType == null) return tileSet.outputs[0];
    for (const out of tileSet.outputs) {
      if (out.extension === tileType) return out;
    }

    for (const out of tileSet.outputs) {
      if (out.extension.endsWith(tileType)) return out;
    }
    return null;
  }

  const img = getImageFormat(tileType ?? 'webp');
  if (img == null) return null;
  return {
    title: `Default ${tileType}`,
    extension: tileType,
    output: {
      type: img,
      lossless: img === 'png' ? true : false,
      background: tileSet.background,
    },
  } as ConfigTileSetRasterOutput;
}

import { getAllImagery, ConfigTileSetRaster } from '@basemaps/config';
import { Bounds, Epsg, TileMatrixSet, TileMatrixSets, VectorFormat } from '@basemaps/geo';
import { Env, fsa } from '@basemaps/shared';
import { Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import { CogTiff } from '@cogeotiff/core';
import { Cotar } from '@cotar/core';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import pLimit from 'p-limit';
import { ConfigLoader } from '../util/config.loader.js';
import { Etag } from '../util/etag.js';
import { filterLayers } from '../util/filter.js';
import { NoContent, NotFound, NotModified } from '../util/response.js';
import { CoSources } from '../util/source.cache.js';
import { TileXyz } from '../util/validate.js';

const LoadingQueue = pLimit(Env.getNumber(Env.TiffConcurrency, 25));

export function getTiffName(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith('.tif') || lowerName.endsWith('.tiff')) return name;
  return `${name}.tiff`;
}

export type CloudArchive = CogTiff | Cotar;

export const TileComposer = new TileMakerSharp(256);

const DefaultResizeKernel = { in: 'lanczos3', out: 'lanczos3' } as const;
const DefaultBackground = { r: 0, g: 0, b: 0, alpha: 0 };

export const TileXyzRaster = {
  async getAssetsForTile(req: LambdaHttpRequest, tileSet: ConfigTileSetRaster, xyz: TileXyz): Promise<string[]> {
    const config = await ConfigLoader.load(req);
    const imagery = await getAllImagery(config, tileSet.layers, [xyz.tileMatrix.projection]);
    const filteredLayers = filterLayers(req, tileSet.layers);

    const output: string[] = [];
    const tileBounds = xyz.tileMatrix.tileToSourceBounds(xyz.tile);

    // All zoom level config is stored as Google zoom levels
    const filterZoom = TileMatrixSet.convertZoomLevel(xyz.tile.z, xyz.tileMatrix, TileMatrixSets.get(Epsg.Google));
    for (const layer of filteredLayers) {
      if (layer.disabled) continue;
      if (layer.maxZoom != null && filterZoom > layer.maxZoom) continue;
      if (layer.minZoom != null && filterZoom < layer.minZoom) continue;

      const imgId = layer[xyz.tileMatrix.projection.code];
      if (imgId == null) {
        req.log.warn({ layer: layer.name, projection: xyz.tileMatrix.projection.code }, 'Failed to lookup imagery');
        continue;
      }

      const img = imagery.get(imgId);
      if (img == null) {
        req.log.warn(
          { layer: layer.name, projection: xyz.tileMatrix.projection.code, imgId },
          'Failed to lookup imagery',
        );
        continue;
      }
      if (!tileBounds.intersects(Bounds.fromJson(img.bounds))) continue;

      for (const c of img.files) {
        if (!tileBounds.intersects(Bounds.fromJson(c))) continue;

        if (img.overviews && img.overviews.maxZoom >= filterZoom && img.overviews.minZoom <= filterZoom) {
          output.push(fsa.join(img.uri, img.overviews.path));
          break;
        }

        const tiffPath = fsa.join(img.uri, getTiffName(c.name));
        output.push(tiffPath);
      }
    }
    return output;
  },

  async tile(req: LambdaHttpRequest, tileSet: ConfigTileSetRaster, xyz: TileXyz): Promise<LambdaHttpResponse> {
    if (xyz.tileType === VectorFormat.MapboxVectorTiles) return NotFound();

    const assetPaths = await this.getAssetsForTile(req, tileSet, xyz);
    const cacheKey = Etag.key(assetPaths);
    if (Etag.isNotModified(req, cacheKey)) return NotModified();

    const toLoad: Promise<CloudArchive | null>[] = [];
    for (const assetPath of assetPaths) {
      toLoad.push(
        LoadingQueue((): Promise<CloudArchive | null> => {
          if (assetPath.endsWith('.tar.co')) {
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

    const assets = (await Promise.all(toLoad)).filter((f) => f != null) as CloudArchive[];

    const tiler = new Tiler(xyz.tileMatrix);
    const layers = await tiler.tile(assets, xyz.tile.x, xyz.tile.y, xyz.tile.z);

    const background = tileSet.background ?? DefaultBackground;

    const res = await TileComposer.compose({
      layers,
      format: xyz.tileType,
      background,
      resizeKernel: tileSet.resizeKernel ?? DefaultResizeKernel,
      metrics: req.timer,
    });

    // If no layers are used and the tile is going to be transparent
    // return 204 no content instead
    if (res.layers === 0 && layers.length === 1) {
      if (background.alpha === 0) return NoContent();
    }

    req.set('layersUsed', res.layers);
    req.set('bytes', res.buffer.byteLength);

    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
    response.buffer(res.buffer, 'image/' + xyz.tileType);
    return response;
  },
};

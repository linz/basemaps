import { Config, ConfigTileSetRaster } from '@basemaps/config';
import { Bounds, Epsg, TileMatrixSet, TileMatrixSets, VectorFormat } from '@basemaps/geo';
import { Env, fsa } from '@basemaps/shared';
import { Tiler } from '@basemaps/tiler';
import { TileMakerSharp } from '@basemaps/tiler-sharp';
import { CogTiff } from '@cogeotiff/core';
import { HttpHeader, LambdaHttpRequest, LambdaHttpResponse } from '@linzjs/lambda';
import pLimit from 'p-limit';
import { Etag } from '../util/etag.js';
import { NotFound, NotModified } from '../util/response.js';
import { CoSources } from '../util/source.cache.js';
import { TileXyz } from '../util/validate.js';

const LoadingQueue = pLimit(Env.getNumber(Env.TiffConcurrency, 25));

export function getTiffName(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith('.tif') || lowerName.endsWith('.tiff')) return name;
  return `${name}.tiff`;
}

export const TileComposer = new TileMakerSharp(256);

const DefaultResizeKernel = { in: 'lanczos3', out: 'lanczos3' } as const;
const DefaultBackground = { r: 0, g: 0, b: 0, alpha: 0 };

export const TileXyzRaster = {
  async getTiffsForTile(req: LambdaHttpRequest, tileSet: ConfigTileSetRaster, xyz: TileXyz): Promise<string[]> {
    const imagery = await Config.getAllImagery(tileSet.layers, [xyz.tileMatrix.projection]);

    const output: string[] = [];
    const tileBounds = xyz.tileMatrix.tileToSourceBounds(xyz.tile);

    // All zoom level config is stored as Google zoom levels
    const filterZoom = TileMatrixSet.convertZoomLevel(xyz.tile.z, xyz.tileMatrix, TileMatrixSets.get(Epsg.Google));
    for (const layer of tileSet.layers) {
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
        const tiffPath = fsa.join(img.uri, getTiffName(c.name));
        output.push(tiffPath);
      }
    }
    return output;
  },

  async tile(req: LambdaHttpRequest, tileSet: ConfigTileSetRaster, xyz: TileXyz): Promise<LambdaHttpResponse> {
    if (xyz.tileType === VectorFormat.MapboxVectorTiles) return NotFound();

    const tiffPaths = await this.getTiffsForTile(req, tileSet, xyz);
    const cacheKey = Etag.key(tiffPaths);
    if (Etag.isNotModified(req, cacheKey)) return NotModified();

    const toLoad: Promise<CogTiff | null>[] = [];
    for (const tiffPath of tiffPaths) {
      toLoad.push(
        LoadingQueue(() => {
          return CoSources.getCog(tiffPath).catch((error) => {
            req.log.warn({ error, tiff: tiffPath }, 'TiffLoadFailed');
            return null;
          });
        }),
      );
    }

    const tiffs = (await Promise.all(toLoad)).filter((f) => f != null) as CogTiff[];

    const tiler = new Tiler(xyz.tileMatrix);
    const layers = await tiler.tile(tiffs, xyz.tile.x, xyz.tile.y, xyz.tile.z);

    const res = await TileComposer.compose({
      layers,
      format: xyz.tileType,
      background: tileSet.background ?? DefaultBackground,
      resizeKernel: tileSet.resizeKernel ?? DefaultResizeKernel,
      metrics: req.timer,
    });

    req.set('layersUsed', res.layers);
    req.set('bytes', res.buffer.byteLength);

    const response = new LambdaHttpResponse(200, 'ok');
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
    response.buffer(res.buffer, 'image/' + xyz.tileType);
    return response;
  },
};

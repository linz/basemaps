import { FsaCache, FsaLog, LogConfig, LogStorage } from '@basemaps/shared';
import { LambdaHttpRequest, LambdaHttpResponse, lf } from '@linzjs/lambda';

import { tileAttributionGet } from './routes/attribution.js';
import { configImageryGet, configTileSetGet } from './routes/config.js';
import { exportTileSetGet } from './routes/export.tileset.js';
import { fontGet, fontList } from './routes/fonts.js';
import { healthGet } from './routes/health.js';
import { imageryGet } from './routes/imagery.js';
import { linkGet } from './routes/link.js';
import { pingGet } from './routes/ping.js';
import { previewIndexGet } from './routes/preview.index.js';
import { tilePreviewGet } from './routes/preview.js';
import { spriteGet } from './routes/sprites.js';
import { tileJsonGet } from './routes/tile.json.js';
import { styleJsonGet } from './routes/tile.style.json.js';
import { wmtsCapabilitiesGet } from './routes/tile.wmts.js';
import { tileXyzGet } from './routes/tile.xyz.js';
import { versionGet } from './routes/version.js';
import { NotFound } from './util/response.js';

export const handler = lf.http(LogConfig.get());

/** If the request takes too long, respond with a 408 timeout when there is approx 1 second remaining */
handler.router.timeoutEarlyMs = 1_000;

function randomTrace(req: LambdaHttpRequest): void {
  // If the env is set to trace level always trace requests
  if (process.env['TRACE']) {
    req.log.level = 'trace';
    return;
  }

  // Set the logging level based off a percent
  const rand = Math.random();
  // 1% trace
  if (rand < 0.01) req.log.level = 'trace';
  // 25% debug
  else if (rand < 0.25) req.log.level = 'debug';
  // everything else info
  else req.log.level = 'info';
}

handler.router.hook('request', (req) => {
  LogStorage.enterWith({ log: req.log });
  FsaLog.reset();

  randomTrace(req);

  req.set('name', 'LambdaTiler');
});

handler.router.hook('response', (req, res) => {
  req.set('fetchCount', FsaLog.count);
  req.set('fetches', FsaLog.requests);
  req.set('cacheSize', FsaCache.size);
  // Force access-control-allow-origin to everything
  res.header('access-control-allow-origin', '*');
});

// CORS is handled by response hook so just return ok if the route exists
handler.router.options('*', (req) => {
  const route = handler.router.router.find('GET', req.path);
  if (route == null) return NotFound();
  return LambdaHttpResponse.ok();
});

// TODO some internal health checks hit these routes, we should change them all to point at /v1/
handler.router.get('/ping', pingGet);
handler.router.get('/health', healthGet);
handler.router.get('/version', versionGet);

handler.router.get('/v1/ping', pingGet);
handler.router.get('/v1/health', healthGet);
handler.router.get('/v1/version', versionGet);

// Image Metadata
handler.router.get('/v1/imagery/:imageryId/:fileName', imageryGet);

// Config
handler.router.get('/v1/config/:tileSet.json', configTileSetGet);
handler.router.get('/v1/config/:tileSet/:imageryId.json', configImageryGet);

// Sprites
handler.router.get('/v1/sprites/:spriteName', spriteGet);

// Fonts
handler.router.get('/v1/fonts.json', fontList);
handler.router.get('/v1/fonts/:fontStack/:range.pbf', fontGet);

// StyleJSON
handler.router.get('/v1/styles/:styleName.json', styleJsonGet);
/** @deprecated 2022-07-22 all styles should be being served from /v1/styles/:styleName.json */
handler.router.get('/v1/tiles/:tileSet/:tileMatrix/style/:styleName.json', styleJsonGet);

// TileJSON
handler.router.get('/v1/tiles/:tileSet/:tileMatrix/tile.json', tileJsonGet);

// Tiles
handler.router.get('/v1/tiles/:tileSet/:tileMatrix/:z/:x/:y.:tileType', tileXyzGet);

// Preview
handler.router.get('/v1/preview/:tileSet/:tileMatrix/:z/:lon/:lat', tilePreviewGet);
handler.router.get('/v1/preview/:tileSet/:tileMatrix/:z/:lon/:lat/:outputType', tilePreviewGet);

handler.router.get('/v1/@:location', previewIndexGet);
handler.router.get('/@:location', previewIndexGet);

// Link
handler.router.get('/v1/link/:tileSet', linkGet);

// Attribution
handler.router.get('/v1/tiles/:tileSet/:tileMatrix/attribution.json', tileAttributionGet);
handler.router.get('/v1/attribution/:tileSet/:tileMatrix/summary.json', tileAttributionGet);

// WMTS Capabilities
handler.router.get('/v1/tiles/:tileSet/:tileMatrix/WMTSCapabilities.xml', wmtsCapabilitiesGet);
handler.router.get('/v1/tiles/:tileSet/WMTSCapabilities.xml', wmtsCapabilitiesGet);
handler.router.get('/v1/tiles/WMTSCapabilities.xml', wmtsCapabilitiesGet);

handler.router.get('/v1/export/:tileSet/:tileMatrix.:extension', exportTileSetGet);

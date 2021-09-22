import { Epsg } from '@basemaps/geo';
import { Env, LogConfig, LogType } from '@basemaps/shared';
import { HttpHeader, LambdaAlbRequest, LambdaHttpRequest } from '@linzjs/lambda';
import { Context } from 'aws-lambda';
import express from 'express';
import path from 'path';
import 'source-map-support/register.js';
import * as ulid from 'ulid';
import url from 'url';
import * as lambda from '../index.js';
import { TileSets } from '../tile.set.cache.js';
import { TileSetRaster } from '../tile.set.raster.js';
import { WmtsCapabilities } from '../wmts.capability.js';
import { Provider } from '../__test__/xyz.util.js';
import { TileSetLocal } from './tile.set.local.js';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const app = express();
const port = Env.getNumber('PORT', 5050);

async function handleRequest(
  ctx: LambdaHttpRequest,
  res: express.Response<any>,
  startTime: number,
  logger: LogType,
  logInfo = {},
): Promise<void> {
  try {
    const data = await lambda.handleRequest(ctx);
    res.status(data.status);
    if (data.headers) {
      for (const [header, value] of data.headers) {
        res.header(header, String(value));
      }
    }
    if (data.status < 299 && data.status > 199) {
      res.end(data.body);
    } else {
      res.end();
    }
    const duration = Date.now() - startTime;
    logger.info({ ...ctx.logContext, ...logInfo, metrics: ctx.timer.metrics, status: data.status, duration }, 'Done');
  } catch (e) {
    logger.fatal({ ...ctx.logContext, err: e }, 'FailedToRender');
    res.status(500);
    res.end();
  }
}

function useAws(): void {
  app.get('/v1/*', async (req: express.Request, res: express.Response) => {
    const startTime = Date.now();
    const requestId = ulid.ulid();
    const logger = LogConfig.get().child({ id: requestId });
    const ctx = new LambdaAlbRequest(
      {
        httpMethod: 'get',
        path: req.path,
        queryStringParameters: req.query,
      } as any,
      { awsRequestId: requestId } as Context,
      logger,
    );
    const ifNoneMatch = req.header(HttpHeader.IfNoneMatch);
    if (ifNoneMatch != null) {
      ctx.headers.set(HttpHeader.IfNoneMatch.toLowerCase(), ifNoneMatch);
    }

    await handleRequest(ctx, res, startTime, logger);
  });

  app.use(express.static(__dirname + '/../../../landing/dist/'));
  LogConfig.get().info({ port, base: process.env[Env.PublicUrlBase], aws: process.env['AWS_PROFILE'] }, 'Listen');
}

async function useLocal(): Promise<void> {
  let projection: number = Epsg.Google.code;
  const filePath = process.argv[2];

  const tileSetName = 'local';
  if (filePath != null) {
    const tileSet = new TileSetLocal(tileSetName, filePath);
    await tileSet.load();
    const tiffFiles = tileSet.tiffs.map((c) => c.source.uri).join(', ');
    // TODO is there a better name for this
    tileSet.setTitle(`Local - ${tiffFiles}`);
    TileSets.add(tileSet);
    LogConfig.get().info({ tileSets: [...TileSets.cache.keys()] }, 'LoadedTileSets');
    projection = tileSet.tileMatrix.projection.code;
  }

  app.get('/v1/tiles/:imageryName/:projection/:z/:x/:y.:ext', async (req: express.Request, res: express.Response) => {
    const startTime = Date.now();
    const requestId = ulid.ulid();
    const logger = LogConfig.get().child({ id: requestId });
    const { x, y, z, ext, imageryName, projection } = req.params;
    const ctx = new LambdaAlbRequest(
      {
        httpMethod: 'get',
        path: `/v1/tiles/${imageryName}/${projection}/${z}/${x}/${y}.${ext}`,
      } as any,
      {} as Context,

      logger,
    );
    await handleRequest(ctx, res, startTime, logger, { tile: { x, y, z } });
  });

  app.get('/v1/WMTSCapabilities.xml', async (req: express.Request, res: express.Response) => {
    const startTime = Date.now();
    const requestId = ulid.ulid();
    const logger = LogConfig.get().child({ id: requestId });

    const tileSets = await Promise.all([...TileSets.cache.values()].map((c) => c.value));
    const xml = WmtsCapabilities.toXml(
      Env.get(Env.PublicUrlBase) ?? '',
      Provider,
      tileSets.filter((f) => f?.type === 'raster') as TileSetRaster[],
    );
    res.header('content-type', 'application/xml');
    res.send(xml);
    res.end();
    const duration = Date.now() - startTime;
    logger.info({ path: req.url, duration, status: 200 }, 'Done');
  });

  app.use(express.static(__dirname + '/../../../landing/dist/'));

  const url = Env.get(Env.PublicUrlBase) + `/?i=${tileSetName}&p=${projection}`;
  const wmts = Env.get(Env.PublicUrlBase) + `/v1/WMTSCapabilities.xml`;
  const xyz = Env.get(Env.PublicUrlBase) + `/v1/tiles/${tileSetName}/${projection}/{z}/{x}/{y}.png`;
  LogConfig.get().info({ url, wmts, xyz }, 'Listen');
}

async function main(): Promise<void> {
  if (Env.get(Env.PublicUrlBase) == null || Env.get(Env.PublicUrlBase) === '') {
    process.env[Env.PublicUrlBase] = `http://localhost:${port}`;
  }

  if (process.argv.length < 3) {
    useAws();
  } else {
    await useLocal();
  }
  await new Promise<void>((resolve) => app.listen(port, resolve));
}

main().catch((e) => console.error(e));

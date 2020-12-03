import { Epsg, TileMatrixSet } from '@basemaps/geo';
import { Env, LogConfig, LogType } from '@basemaps/shared';
import { HttpHeader, LambdaContext } from '@basemaps/lambda';
import express from 'express';
import { PrettyTransform } from 'pretty-json-log';
import 'source-map-support/register';
import * as ulid from 'ulid';
import * as lambda from '../index';
import { TileSets } from '../tile.set.cache';
import { WmtsCapabilities } from '../wmts.capability';
import { Provider } from '../__test__/xyz.util';
import { TileSetLocal } from './tile.set.local';
import { Tilers } from '../tiler';

const app = express();
const port = Env.getNumber('PORT', 5050);

if (process.stdout.isTTY) LogConfig.setOutputStream(PrettyTransform.stream());

async function handleRequest(
    ctx: LambdaContext,
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
        logger.info({ ...ctx.logContext, ...logInfo, status: data.status, duration }, 'Done');
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
        const ctx = new LambdaContext(
            {
                httpMethod: 'get',
                path: req.path,
                queryStringParameters: req.query,
            } as any,
            logger,
        );
        const ifNoneMatch = req.header(HttpHeader.IfNoneMatch);
        if (ifNoneMatch != null) {
            ctx.headers.set(HttpHeader.IfNoneMatch.toLowerCase(), ifNoneMatch);
        }

        await handleRequest(ctx, res, startTime, logger);
    });

    LogConfig.get().info({ port, base: process.env[Env.PublicUrlBase], aws: process.env['AWS_PROFILE'] }, 'Listen');
}

async function useLocal(): Promise<void> {
    let projection: number = Epsg.Google.code;
    const filePath = process.argv[2];

    const tileSetName = 'local';
    if (filePath != null) {
        const tileSet = new TileSetLocal(tileSetName, Epsg.Google, filePath);
        await tileSet.load();
        const tiffFiles = tileSet.tiffs.map((c) => c.source.name).join(', ');
        // TODO is there a better name for this
        tileSet.setTitle(`Local - ${tiffFiles}`);
        TileSets.set(tileSet.id, tileSet);
        LogConfig.get().info({ tileSets: [...TileSets.keys()] }, 'LoadedTileSets');
        projection = tileSet.projection.code;
    }

    app.get('/v1/tiles/:imageryName/:projection/:z/:x/:y.:ext', async (req: express.Request, res: express.Response) => {
        const startTime = Date.now();
        const requestId = ulid.ulid();
        const logger = LogConfig.get().child({ id: requestId });
        const { x, y, z, ext, imageryName, projection } = req.params;
        const ctx = new LambdaContext(
            {
                httpMethod: 'get',
                path: `/v1/tiles/${imageryName}/${projection}/${z}/${x}/${y}.${ext}`,
            } as any,
            logger,
        );
        await handleRequest(ctx, res, startTime, logger, { tile: { x, y, z } });
    });

    app.get('/v1/WMTSCapabilities.xml', async (req: express.Request, res: express.Response) => {
        const startTime = Date.now();
        const requestId = ulid.ulid();
        const logger = LogConfig.get().child({ id: requestId });

        const tileMatrixSets = new Map<Epsg, TileMatrixSet>();
        for (const ts of TileSets.values()) {
            const tiler = Tilers.get(ts.projection);
            if (tiler == null) {
                throw new Error("Can't find tiler for projection " + ts.projection);
            }
            tileMatrixSets.set(ts.projection, tiler.tms);
        }

        const xml = WmtsCapabilities.toXml(
            Env.get(Env.PublicUrlBase) ?? '',
            Provider,
            [...TileSets.values()],
            tileMatrixSets,
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
    if (Env.get(Env.PublicUrlBase) == null || Env.get(Env.PublicUrlBase) == '') {
        process.env[Env.PublicUrlBase] = `http://localhost:${port}`;
    }

    if (process.argv.length < 3) {
        useAws();
    } else {
        await useLocal();
    }
    await new Promise((resolve) => app.listen(port, resolve));
}

main().catch((e) => console.error(e));

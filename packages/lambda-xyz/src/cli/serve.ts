import { Epsg } from '@basemaps/geo';
import { Env, LambdaContext, LogConfig, LogType } from '@basemaps/lambda-shared';
import * as express from 'express';
import { PrettyTransform } from 'pretty-json-log';
import 'source-map-support/register';
import * as ulid from 'ulid';
import * as lambda from '../index';
import { TileSets } from '../tile.set.cache';
import { TileSetLocal } from './tile.set.local';

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
            res.end(Buffer.from(data.getBody() ?? '', 'base64'));
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

async function main(): Promise<void> {
    if (Env.get(Env.PublicUrlBase) == '') {
        process.env[Env.PublicUrlBase] = `http://localhost:${port}`;
    }
    let projection: number | null = null;
    const filePath = process.argv[2];
    if (filePath != null) {
        const tileSet = new TileSetLocal('local', Epsg.Google, filePath);
        await tileSet.load();
        TileSets.set(tileSet.id, tileSet);
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

    app.get(
        '/v1/tiles/:imageryName/:projection/WMTSCapabilities.xml',
        async (req: express.Request, res: express.Response) => {
            const startTime = Date.now();
            const requestId = ulid.ulid();
            const logger = LogConfig.get().child({ id: requestId });
            const { imageryName, projection } = req.params;
            const ctx = new LambdaContext(
                {
                    httpMethod: 'get',
                    path: `/v1/tiles/${imageryName}/${projection}/WMTSCapabilities.xml`,
                } as any,
                logger,
            );
            await handleRequest(ctx, res, startTime, logger);
        },
    );

    app.use(express.static(__dirname + '/../../../landing/static/'));
    await new Promise((resolve) => app.listen(port, resolve));

    let url = Env.get(Env.PublicUrlBase) + '/?i=local';
    if (projection != null) url = url + `&p=${projection}`;
    LogConfig.get().info({ url }, 'Listen');
}

main().catch((e) => console.error(e));

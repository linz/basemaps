import { Env, FileOperator, FileOperatorS3, FileProcessor, LogConfig, LambdaContext } from '@basemaps/lambda-shared';
import { CogSource, CogTiff } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogSourceFile } from '@cogeotiff/source-file';
import * as express from 'express';
import * as ulid from 'ulid';
import * as lambda from '../index';
import { TileSet } from '../tile.set';
import { EPSG } from '@basemaps/geo';
import { TileSets } from '../tile.set.cache';
import { PrettyTransform } from 'pretty-json-log';

const app = express();
const port = Env.getNumber('PORT', 5050);
if (Env.get(Env.CogBucket, undefined) == null) {
    process.env[Env.CogBucket] = '';
}

if (process.stdout.isTTY) {
    LogConfig.setOutputStream(PrettyTransform.stream());
}

function getTiffs(fs: FileProcessor, tiffList: string[]): CogSource[] {
    if (fs instanceof FileOperatorS3) {
        return tiffList.map((path) => {
            const { bucket, key } = FileOperatorS3.parse(path);
            // Use the same s3 credentials to access the files that were used to list them
            return new CogSourceAwsS3(bucket, key, fs.s3);
        });
    }
    return tiffList.map((path) => new CogSourceFile(path));
}

export class TileSetLocal extends TileSet {
    tiffs: CogTiff[];
    filePath: string;

    constructor(name: string, projection: EPSG, path: string) {
        super(name, projection);
        this.filePath = path;
    }

    async load(): Promise<void> {
        if (this.tiffs != null) return;
        const tiffFs = FileOperator.create(this.filePath);

        const fileList = await tiffFs.list(this.filePath);
        const files = fileList.filter((f) => f.toLowerCase().endsWith('.tif') || f.toLowerCase().endsWith('.tiff'));
        this.tiffs = getTiffs(tiffFs, files).map((c) => new CogTiff(c));
    }

    async getTiffsForQuadKey(): Promise<CogTiff[]> {
        return this.tiffs;
    }
}

async function main(): Promise<void> {
    const filePath = process.argv[2];
    if (filePath != null) {
        const tileSet = new TileSetLocal('aerial', EPSG.Google, filePath);
        TileSets.set(tileSet.id, tileSet);
    }

    app.get('/v1/tiles/:imageryName/:projection/:z/:x/:y.png', async (req: express.Request, res: express.Response) => {
        const startTime = Date.now();
        const requestId = ulid.ulid();
        const logger = LogConfig.get().child({ id: requestId });
        const { x, y, z, imageryName, projection } = req.params;
        const ctx = new LambdaContext(
            {
                httpMethod: 'get',
                path: `/v1/tiles/${imageryName}/${projection}/${z}/${x}/${y}.png`,
            } as any,
            logger,
        );
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
            logger.info({ ...ctx.logContext, tile: { x, y, z }, status: data.status, duration }, 'Done');
        } catch (e) {
            logger.fatal({ ...ctx.logContext, err: e }, 'FailedToRender');
            res.status(500);
            res.end();
        }
    });

    app.use(express.static('../landing/static/'));
    await new Promise((resolve) => app.listen(port, resolve));
    console.log('Listen', `http://localhost:${port}`);
}

main().catch((e) => console.error(e));

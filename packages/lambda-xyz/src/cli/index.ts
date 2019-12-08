import { LogConfig, LambdaSession } from '@basemaps/shared';
import { CogTiff } from '@cogeotiff/core';
import { CogSourceFile } from '@cogeotiff/source-file';
import * as express from 'express';
import * as fs from 'fs';
import pLimit from 'p-limit';
import * as path from 'path';
import * as ulid from 'ulid';
import * as lambda from '../index';
import { TiffUtil } from '../tiff';

const app = express();
const q = pLimit(5);

async function main(): Promise<void> {
    const filePath = process.argv[2];
    if (filePath == null) {
        console.log('Usage: cli.js <tiffPath>');
        process.exit(1);
    }

    const files = fs
        .readdirSync(filePath)
        .filter(f => f.toLowerCase().endsWith('.tif') || f.toLowerCase().endsWith('.tiff'))
        .map(f => path.join(filePath, f));

    const allTiffs = files.map(
        (tiffPath): Promise<CogTiff> => {
            return q(async () => {
                const source = new CogSourceFile(tiffPath);
                const tiff = new CogTiff(source);
                await tiff.init();
                return tiff;
            });
        },
    );

    TiffUtil.load = (): Promise<CogTiff>[] => allTiffs;

    console.time('LoadTiff');
    await Promise.all(allTiffs);
    console.timeEnd('LoadTiff');

    app.get('/:z/:x/:y.png', async (req: express.Request, res: express.Response) => {
        const startTime = Date.now();
        const requestId = ulid.ulid();
        const logger = LogConfig.get().child({ id: requestId });
        LambdaSession.reset();
        const { x, y, z } = req.params;

        const data = await lambda.handleRequest(
            {
                httpMethod: 'get',
                path: `/foo/${z}/${x}/${y}.png`,
            } as any,
            {} as any,
            logger,
        );

        if (data.headers) {
            for (const header of Object.keys(data.headers)) {
                res.header(header, data.headers[header]);
            }
        }
        res.end(Buffer.from(data.toResponse().body, 'base64'));
        const duration = Date.now() - startTime;
        logger.info({ tile: { x, y, z }, duration }, 'Done');
    });

    await new Promise(resolve => app.listen(5050, resolve));
    console.log('Listen', 'http://localhost:5050');
}

main().catch(e => console.error(e));

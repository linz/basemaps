import { Env, FileOperator, FileOperatorS3, FileProcessor, LambdaSession, LogConfig } from '@basemaps/shared';
import { CogSource, CogTiff } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogSourceFile } from '@cogeotiff/source-file';
import * as express from 'express';
import * as ulid from 'ulid';
import * as lambda from '../index';
import { TiffUtil } from '../tiff';
import { MosaicCog } from '../tiff.mosaic';

const app = express();
const port = Env.getNumber('PORT', 5050);
if (Env.get(Env.CogBucket, undefined) == null) {
    process.env[Env.CogBucket] = '';
}
function getTiffs(fs: FileProcessor, tiffList: string[]): CogSource[] {
    if (fs instanceof FileOperatorS3) {
        return tiffList.map(path => {
            const { bucket, key } = FileOperatorS3.parse(path);
            // Use the same s3 credentials to access the files that were used to list them
            return new CogSourceAwsS3(bucket, key, fs.s3);
        });
    }
    return tiffList.map(path => new CogSourceFile(path));
}

async function main(): Promise<void> {
    const filePath = process.argv[2];
    if (filePath != null) {
        const tiffFs = FileOperator.create(filePath);

        const fileList = await tiffFs.list(filePath);
        const files = fileList.filter(f => f.toLowerCase().endsWith('.tif') || f.toLowerCase().endsWith('.tiff'));
        const allTiffs = getTiffs(tiffFs, files).map(c => new CogTiff(c));

        // TODO Should convert tiff into quadkey bounding boxes
        TiffUtil.getTiffsForQuadKey = (): CogTiff[] => allTiffs;
        TiffUtil.load = (): MosaicCog[] => [];
    }

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

    app.use(express.static('./static/'));
    await new Promise(resolve => app.listen(port, resolve));
    console.log('Listen', `http://localhost:${port}`);
}

main().catch(e => console.error(e));

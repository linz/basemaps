import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogTiff } from '@cogeotiff/core';
import { Env } from '@basemaps/shared';

let Tiffs: Promise<CogTiff>[] = [];

export const TiffUtil = {
    /** Load all the tiffs needed for the tiler */
    load(): Promise<CogTiff>[] {
        if (Tiffs.length > 0) {
            return Tiffs;
        }

        const bucketName = process.env[Env.CogBucket];
        if (bucketName == null) {
            throw new Error(`Invalid environment missing "${Env.CogBucket}"`);
        }

        Tiffs = [
            CogSourceAwsS3.create(
                bucketName,
                '2019-09-20-2019-NZ-Sentinel-3band-alpha.compress_webp.align_google.aligned_3.bs_512.tif',
            ),
            CogSourceAwsS3.create(bucketName, '2019-09-30-bg43.webp.google.aligned.cog.tif'),
        ];
        return Tiffs;
    },
};

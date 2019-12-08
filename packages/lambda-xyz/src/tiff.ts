import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import { CogTiff } from '@cogeotiff/core';
import { Env } from '@basemaps/shared';

let Tiffs: Promise<CogTiff>[] = [];

function createTiffs(bucketName: string, path: string, files: string[]): Promise<CogTiff>[] {
    return files.map(f => CogSourceAwsS3.create(bucketName, path + '/' + f));
}

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
            CogSourceAwsS3.create(bucketName, '2019/new-zealand/new_zealand_sentinel_2018-19_10m/2019-12-04/31.tiff'),
            // TODO list folder and load everything in folder
            ...createTiffs(bucketName, '2019/new-zealand/gisborne_rural_2017-18_0.3m/2019-12-06/', [
                '3113331221.tiff',
                '3113331222.tiff',
                '3113331223.tiff',
                '3113331230.tiff',
                '3113331212.tiff',
            ]),
            CogSourceAwsS3.create(bucketName, '2019-10-15.bg43.webp.google.aligned.cogrs_lan.bs_512.ali_3.alp_y.tif'),
        ];
        return Tiffs;
    },
};

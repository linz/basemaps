import { Env, QuadKey } from '@basemaps/shared';
import { CogTiff } from '@cogeotiff/core';
import { CogSourceAwsS3 } from '@cogeotiff/source-aws';
import * as path from 'path';

let Tiffs: MosaicCog[] = [];

/**
 * Collections of COGs representing a imagery set
 *
 * All COGs should be QuadKey aligned which allows for efficent searching for required COGs
 *
 * @see GdalCogDriver https://gdal.org/drivers/raster/cog.html
 */
export class MosaicCog {
    basePath: string;
    bucket: string;
    quadKeys: string[];
    sources: Map<string, CogTiff>;
    zoom = { min: 0, max: 32 };

    constructor(bucket: string, basePath: string, quadKeys: string[], zoomMin = 0, zoomMax = 32) {
        this.bucket = bucket;
        this.basePath = basePath;
        this.quadKeys = quadKeys;
        this.sources = new Map();
        this.zoom.min = zoomMin;
        this.zoom.max = zoomMax;
    }

    getSource(quadKey: string): CogTiff {
        let existing = this.sources.get(quadKey);
        if (existing == null) {
            if (!this.quadKeys.includes(quadKey)) {
                throw new Error(`QuadKey: ${quadKey} not found in source`);
            }
            existing = new CogTiff(new CogSourceAwsS3(this.bucket, path.join(this.basePath, `${quadKey}.tiff`)));
            this.sources.set(quadKey, existing);
        }
        return existing;
    }

    getTiffsForQuadKey(qk: string): CogTiff[] {
        const output: CogTiff[] = [];
        for (const tiffQk of this.quadKeys) {
            if (QuadKey.intersects(tiffQk, qk)) {
                output.push(this.getSource(tiffQk));
            }
        }
        return output;
    }
}

export const TiffUtil = {
    getTiffsForQuadKey(qk: string, zoom: number): CogTiff[] {
        const tiffs = TiffUtil.load();
        const output: CogTiff[] = [];
        for (const mosaic of tiffs) {
            if (zoom > mosaic.zoom.max) {
                continue;
            }

            if (zoom < mosaic.zoom.min) {
                continue;
            }

            for (const tiff of mosaic.getTiffsForQuadKey(qk)) {
                output.push(tiff);
            }
        }
        return output;
    },

    /** Load all the tiffs needed for the tiler */
    load(): MosaicCog[] {
        if (Tiffs.length > 0) {
            return Tiffs;
        }

        const bucketName = process.env[Env.CogBucket];
        if (bucketName == null) {
            throw new Error(`Invalid environment missing "${Env.CogBucket}"`);
        }

        Tiffs = [
            new MosaicCog(bucketName, '2019/world/bathy-gebco/01DYE4EGR92TNMV16AHXSR45JH/', ['0', '1', '2', '3']),
            new MosaicCog(bucketName, '2019/new-zealand/new_zealand_sentinel_2018-19_10m/2019-12-04/', ['31'], 0, 32),
            new MosaicCog(
                bucketName,
                '2019/new-zealand/gisborne_rural_2017-18_0.3m/2019-12-06/',
                [
                    '31133310323',
                    '31133310332',
                    '31133310333',
                    '31133312031',
                    '31133312033',
                    '3113331210',
                    '3113331211',
                    '3113331212',
                    '31133312130',
                    '31133312132',
                    '31133312201',
                    '31133312203',
                    '3113331221',
                    '3113331222',
                    '3113331223',
                    '3113331230',
                    '31133312310',
                    '31133312312',
                    '3113331232',
                    '31133312330',
                    '31133330000',
                    '31133330001',
                    '31133330010',
                    '31133330011',
                    '31133330013',
                    '31133330100',
                    '31133330102',
                ],
                13,
            ),
            new MosaicCog(
                bucketName,
                '2019/new-zealand/gisborne_0.1m_urban_2017-2018/2019-12-11/',
                [
                    '3113331033200',
                    '3113331033201',
                    '3113331033212',
                    '3113331033213',
                    '3113331211031',
                    '311333121120',
                    '3113331211210',
                    '3113331211212',
                    '3113331213003',
                    '3113331213023',
                    '3113331213032',
                    '3113331213201',
                    '3113331213221',
                    '3113331213223',
                    '3113331220131',
                    '3113331221020',
                    '3113331221130',
                    '3113331221132',
                    '3113331221313',
                    '3113331223131',
                    '3113331230222',
                    '311333123102',
                    '3113331232000',
                    '3113331232003',
                    '3113331232012',
                    '311333123202',
                    '311333123203',
                    '3113331232111',
                    '311333123212',
                    '311333123220',
                    '3113331232210',
                    '3113331232211',
                    '3113331232220',
                    '3113331232221',
                    '3113331232300',
                ],
                14,
            ),
            new MosaicCog(
                bucketName,
                'new-zealand/dunedin_urban_2018-19_0.1m/01DZJ6K7H3F8EQ9CC5VZXJY80N/',
                [
                    '31311201221',
                    '313112012101',
                    '313112012121',
                    '313112012123',
                    '313112012132',
                    '313112012200',
                    '313112012202',
                    '313112012203',
                    '313112012300',
                    '313112012301',
                    '3131120013312',
                    '3131120013313',
                    '3131120033132',
                    '3131120100230',
                    '3131120100232',
                    '3131120103233',
                    '3131120103322',
                    '3131120120333',
                    '3131120121023',
                    '3131120121030',
                    '3131120121031',
                    '3131120121032',
                    '3131120121100',
                    '3131120121102',
                    '3131120121201',
                    '3131120121203',
                    '3131120121221',
                    '3131120121222',
                    '3131120121223',
                    '3131120121302',
                    '3131120121303',
                    '3131120122010',
                    '3131120122011',
                    '3131120122013',
                    '3131120122200',
                    '3131120122201',
                    '3131120122210',
                    '3131120122211',
                    '3131120122220',
                    '3131120122221',
                    '3131120122300',
                    '3131120123020',
                    '3131120123021',
                ],
                14,
            ),
        ];

        return Tiffs;
    },
};

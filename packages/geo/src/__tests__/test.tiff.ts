import { Epsg, EpsgCode } from '../epsg';
import { CogTiff } from '@cogeotiff/core';
import { CogSourceFile } from '@cogeotiff/source-file';
import path = require('path');
import { TileMatrixSet } from '../tile.matrix.set';
import { Nztm2000Tms } from '../tms/nztm2000';
import { GoogleTms } from '../tms/google';

export const TestDataPath = path.join(__dirname, '../../../../test-data');

const TiffGoogle = path.join(TestDataPath, 'rgba8.google.tiff');
const TiffNztm2000 = path.join(TestDataPath, 'rgba8.nztm2000.tiff');

const sourceGoogle = new CogSourceFile(TiffGoogle);
const sourceNztm2000 = new CogSourceFile(TiffNztm2000);

/**
 * Get the associated testing tiff from projection
 */
export function getTestingTiff(proj: Epsg): Promise<CogTiff> {
    switch (proj.code) {
        case EpsgCode.Nztm2000:
            return new CogTiff(sourceNztm2000).init();
        case EpsgCode.Google:
            return new CogTiff(sourceGoogle).init();
        default:
            throw new Error('Invalid projection');
    }
}

/**
 * get the associated matrix set from projection
 */
export function getTms(proj: Epsg): TileMatrixSet {
    switch (proj.code) {
        case EpsgCode.Nztm2000:
            return Nztm2000Tms;
        case EpsgCode.Google:
            return GoogleTms;
        default:
            throw new Error('Invalid projection');
    }
}

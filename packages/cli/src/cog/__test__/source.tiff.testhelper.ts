import { EpsgCode } from '@basemaps/geo';
import { NamedBounds } from '@basemaps/shared';
import { CogJob } from '../types';

export const SourceTiffTestHelper = {
    makeCogJob(): CogJob {
        return {
            projection: EpsgCode.Google,
            source: {
                files: [] as NamedBounds[],
                resZoom: 13,
                pixelScale: 9.55,
                path: '',
                options: {
                    maxConcurrency: 3,
                },
            },
            output: {
                vrt: { addAlpha: true },
            },
        } as CogJob;
    },

    tiffNztmBounds(path = '/path/to'): NamedBounds[] {
        return [
            {
                name: path + '/tiff1.tiff',
                x: 1732000,
                y: 5442000,
                width: 24000,
                height: 36000,
            },
            {
                name: path + '/tiff2.tiff',
                x: 1756000,
                y: 5442000,
                width: 24000,
                height: 36000,
            },
        ];
    },

    namedBoundsToPaths(bounds: NamedBounds[]): string[] {
        return bounds.map(({ name }): string => `/path/to/tiff${name}.tiff`);
    },
};

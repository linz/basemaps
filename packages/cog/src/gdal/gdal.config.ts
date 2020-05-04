export interface GdalCogBuilderOptions {
    /**
     * Number of aligned tile levels
     * @default 1
     */
    alignmentLevels: number;

    /** Limit the output to a bounding box
     */
    bbox?: [number, number, number, number];

    /**
     * Compression to use for the cog
     * @default 'webp'
     */
    compression: 'webp' | 'jpeg';

    /**
     * Resampling method to use
     * @default 'bilinear'
     */
    resampling: GdalCogBuilderOptionsResampling;
    /**
     * Output tile size
     * @default 512
     */
    blockSize: 256 | 512 | 1024 | 2048 | 4096;
}
export type GdalCogBuilderOptionsResampling =
    | 'nearest'
    | 'bilinear'
    | 'cubic'
    | 'cubicspline'
    | 'lanczos'
    | 'average'
    | 'mode';

export const gdalCogBuilderOptionsResamplingDefault: GdalCogBuilderOptionsResampling = 'bilinear';

const resampleMap: Record<string, GdalCogBuilderOptionsResampling> = {
    nearest: 'nearest',
    bilinear: 'bilinear',
    cubic: 'cubic',
    cubicspline: 'cubicspline',
    lanczos: 'lanczos',
    average: 'average',
    mode: 'mode',
};

export function getResample(t: string | undefined): GdalCogBuilderOptionsResampling {
    if (t && resampleMap[t]) {
        return resampleMap[t];
    }
    return resampleMap[gdalCogBuilderOptionsResamplingDefault];
}

export type GdalCogBuilderOptionsResampling =
    | 'nearest'
    | 'bilinear'
    | 'cubic'
    | 'cubicspline'
    | 'lanczos'
    | 'average'
    | 'mode';

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

    /**
     * Compression quality
     */
    quality: number;
}

export const GdalCogBuilderDefaults: GdalCogBuilderOptions = {
    resampling: 'bilinear',
    compression: 'webp',
    alignmentLevels: 1,
    blockSize: 512,
    quality: 90,
};

export const GdalResamplingOptions: Record<string, GdalCogBuilderOptionsResampling> = {
    nearest: 'nearest',
    bilinear: 'bilinear',
    cubic: 'cubic',
    cubicspline: 'cubicspline',
    lanczos: 'lanczos',
    average: 'average',
    mode: 'mode',
};

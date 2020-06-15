import { Epsg } from '@basemaps/geo';

export type GdalCogBuilderOptionsResampling =
    | 'nearest'
    | 'bilinear'
    | 'cubic'
    | 'cubicspline'
    | 'lanczos'
    | 'average'
    | 'mode';

export enum TilingScheme {
    Google = 'GoogleMapsCompatible',
    Nztm2000 = 'NZTM2000',
}

export interface GdalCogBuilderOptions {
    /**
     * How to align levels
     */
    tilingScheme: TilingScheme;
    /**
     * Number of aligned tile levels
     * @default 1
     */
    alignmentLevels: number;
    projection: Epsg;

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
    blockSize: number;

    targetRes: number;

    /**
     * Compression quality
     */
    quality: number;
}

export const GdalCogBuilderDefaults: GdalCogBuilderOptions = {
    resampling: 'bilinear',
    compression: 'webp',
    tilingScheme: TilingScheme.Google,
    projection: Epsg.Google,
    alignmentLevels: 1,
    targetRes: 0,
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

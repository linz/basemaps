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
     * @default 'lanczos'
     */
    resampling: 'lanczos';

    /**
     * Output tile size
     * @default 512
     */
    blockSize: 256 | 512 | 1024 | 2048 | 4096;
}

/** Image formats supported by basemaps */
export type ImageFormat = 'webp' | 'png' | 'jpeg' | 'avif';

/** Vector tile formats supported by basemaps */
export type VectorFormat = 'pbf';

/** Supported output formats */
export type OutputFormat = ImageFormat | VectorFormat;

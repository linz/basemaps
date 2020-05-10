/** The image with of a single tile in pixels */
export const SingleTileWidth = 256 * 1.5;

/** Maximum desired image size */
export const MaxImagePixelDim = 256000;

/** Zoom difference from targetZoom to minZoom for maxImagePixelDim */
export const ZoomDifferenceForMaxImage = 1 - Math.floor(Math.log2(MaxImagePixelDim / SingleTileWidth));

/** When a tile has at least this much covering merge it up to parent */
export const CoveringPercentage = 0.25;

/** The zoom level of the cutline polygon */
export const CutlineZoom = 15;

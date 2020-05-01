/** The image with of a single tile in pixels */
export const singleTileWidth = 256 * 1.5;

/** Maximum desired image size */
export const maxImagePixelDim = 256000;

/** Zoom difference from targetZoom to minZoom for maxImagePixelDim */
export const zoomDifferenceForMaxImage = 1 - Math.floor(Math.log2(maxImagePixelDim / singleTileWidth));

/** When a tile has at least this much covering merge it up to parent */
export const coveringPercentage = 0.6;

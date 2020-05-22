import { Bounds, Projection } from '@basemaps/geo';
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import { Composition } from './raster';

export interface RasterPixelBounds {
    /** Bounds in Raster Pixels of the output tile */
    tile: Bounds;

    /** Bounds of what needs to be drawn onto the output tile */
    intersection: Bounds;

    /** Bounds in Raster Pixels of the full Tiff Image */
    tiff: Bounds;
}

export class Tiler {
    public projection: Projection;

    /** Tile size for the tiler and sub objects */
    public readonly tileSize: number;

    public constructor(tileSize: number) {
        this.tileSize = tileSize;
        this.projection = new Projection(tileSize);
    }

    /**
     * Generate a list of compositions from a list of tiffs for the provided web mercator XYZ
     *
     * @param tiffs List of tiffs to use in composition
     * @param x WebMercator X
     * @param y WebMercator Y
     * @param zoom WebMercator Zoom
     * @param logger
     */
    public async tile(tiffs: CogTiff[], x: number, y: number, zoom: number): Promise<Composition[] | null> {
        let layers: Composition[] = [];

        for (const tiff of tiffs) {
            const tileOverlays = this.getTiles(tiff, x, y, zoom);
            if (tileOverlays == null) {
                continue;
            }
            layers = layers.concat(tileOverlays);
        }

        if (layers.length === 0) {
            return null;
        }

        return layers;
    }

    /**
     * Does this tiff have any imagery inside the WebMercator XYZ tile
     *
     * @param tiff CoGeoTiff to check bounds of
     * @param x WebMercator x
     * @param y WebMercator y
     * @param zoom WebMercator zoom
     */
    public getRasterTiffIntersection(tiff: CogTiff, x: number, y: number, zoom: number): RasterPixelBounds | null {
        const extentMeters = tiff.images[0].bbox;
        /** Raster pixels of the output tile */
        const screenBoundsPx = this.projection.getPixelsFromTile(x, y);
        /** Raster pixels of the input geotiff */
        const tiffBoundsPx = this.projection.getPixelsBoundsFromMeters(extentMeters, zoom);

        /** Raster pixels that need to be filled by this tiff */
        const intersectionPx = tiffBoundsPx.intersection(screenBoundsPx);
        // No intersection
        if (intersectionPx == null) return null;
        return { tiff: tiffBoundsPx, intersection: intersectionPx, tile: screenBoundsPx };
    }

    protected createComposition(
        img: CogTiffImage,
        x: number,
        y: number,
        scaleFactor: number,
        raster: RasterPixelBounds,
    ): Composition | null {
        const tileSourceBounds = img.getTileBounds(x, y);
        const source = new Bounds(
            tileSourceBounds.x,
            tileSourceBounds.y,
            tileSourceBounds.width,
            tileSourceBounds.height,
        );

        const target = source.scale(scaleFactor, scaleFactor).add(raster.tiff).round();

        // Validate that the requested COG tile actually intersects with the output raster
        const tileIntersection = target.intersection(raster.tile);
        if (tileIntersection == null) return null;

        // If the output tile bounds are less than a pixel there is not much point rendering them
        const tileBounds = tileIntersection.subtract(target);
        if (tileBounds.height < 0.5 || tileBounds.width < 0.5) {
            return null;
        }

        const drawAtRegion = target.subtract(raster.tile);
        const composition: Composition = {
            tiff: img.tif,
            source: { x, y, imageId: img.id },
            y: Math.max(0, Math.round(drawAtRegion.y)),
            x: Math.max(0, Math.round(drawAtRegion.x)),
        };

        // Sometimes the source image is smaller than the tile size,
        // Need to crop the tile down to the actual image extent
        if (source.width < img.tileSize.width || source.height < img.tileSize.height) {
            composition.extract = { width: source.width, height: source.height };
        }

        // Often COG tiles do not align to the same size as XYZ Tiles
        // This will scale the COG tile to the same size as a XYZ
        if (source.width != target.width || source.height != target.height) {
            composition.resize = { width: target.width, height: target.height };
        }

        // If the output XYZ tile needs a piece of a COG tile, extract the speicific
        // Bounding box
        if (
            tileBounds.y != 0 ||
            tileBounds.x != 0 ||
            tileBounds.height !== target.height ||
            tileBounds.width !== target.width
        ) {
            composition.crop = tileBounds;
        }

        return composition;
    }

    protected getTiles(tiff: CogTiff, x: number, y: number, z: number): Composition[] | null {
        const rasterBounds = this.getRasterTiffIntersection(tiff, x, y, z);
        if (rasterBounds == null) return null;

        // Find the best internal overview tiff to use with the desired XYZ resolution
        const targetResolution = this.projection.getResolution(z);
        const img = tiff.getImageByResolution(targetResolution);
        // Often the overviews do not align to the actual resolution we want so we will need to scale the overview to the correct resolution
        const pixelScale = targetResolution / img.resolution[0];

        // Determine the pixels that are needed from the source tiff to render the XYZ Tile
        const requiredTifPixels = rasterBounds.intersection.subtract(rasterBounds.tiff);

        const { tileSize } = img;
        const startX = Math.floor((requiredTifPixels.x / tileSize.width) * pixelScale);
        const endX = Math.ceil((requiredTifPixels.right / tileSize.width) * pixelScale);
        const startY = Math.floor((requiredTifPixels.y / tileSize.height) * pixelScale);
        const endY = Math.ceil((requiredTifPixels.bottom / tileSize.height) * pixelScale);

        const composites = [];
        const pixelScaleInv = 1 / pixelScale;

        // For each geotiff tile that is required, scale it to the size of the raster output tile
        for (let x = startX; x < endX; x++) {
            for (let y = startY; y < endY; y++) {
                const composition = this.createComposition(img, x, y, pixelScaleInv, rasterBounds);
                if (composition != null) {
                    composites.push(composition);
                }
            }
        }

        if (composites.length === 0) return null;
        return composites;
    }
}

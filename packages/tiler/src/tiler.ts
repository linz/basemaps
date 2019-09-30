import { LambdaSession, Logger } from '@basemaps/shared';
import { Bounds } from '@basemaps/shared/build/bounds';
import { Projection } from '@basemaps/shared/build/projection';
import { CogTiff, CogTiffImage } from '@cogeotiff/core';
import { Composition, Raster } from './raster';

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
    public raster: Raster;

    public constructor(tileSize: number) {
        this.projection = new Projection(tileSize);
        this.raster = new Raster(tileSize);
    }

    public async tile(
        tiffs: CogTiff[],
        x: number,
        y: number,
        z: number,
        logger: typeof Logger,
    ): Promise<Buffer | null> {
        let layers: Composition[] = [];
        const timer = LambdaSession.get().timer;
        timer.start('tile:get');
        for (const tiff of tiffs) {
            const tileOverlays = this.getTiles(tiff, x, y, z, logger.child({ tiff: tiff.source.name }));
            if (tileOverlays == null) {
                continue;
            }
            layers = layers.concat(tileOverlays);
        }
        timer.start('tile:get');

        logger.info({ layers: layers.length }, 'Composing');
        timer.start('tile:compose');
        if (layers.length === 0) {
            timer.end('tile:compose');
            return null;
        }
        const raster = await this.raster.compose(
            layers,
            logger,
        );
        timer.end('tile:compose');
        return raster;
    }

    protected getRasterTiffIntersection(tiff: CogTiff, x: number, y: number, z: number): RasterPixelBounds | null {
        const extentMeters = tiff.images[0].bbox;
        /** Raster pixels of the output tile */
        const screenBoundsPx = this.projection.getPixelsFromTile(x, y);
        /** Raster pixels of the input geotiff */
        const tiffBoundsPx = this.projection.getPixelsBoundsFromMeters(extentMeters, z);

        /** Raster pixels that need to be filled by this tiff */
        const intersectionPx = tiffBoundsPx.intersection(screenBoundsPx);
        // No intersection
        if (intersectionPx == null) {
            return null;
        }
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

        const target = source
            .scale(scaleFactor, scaleFactor)
            .add(raster.tiff)
            .round();

        // Validate that the requested COG tile actually intersects with the output raster
        const tileIntersection = target.intersection(raster.tile);
        if (tileIntersection == null) {
            return null;
        }

        // If the output tile bounds are less than a pixel there is not much point rendering them
        const tileBounds = tileIntersection.subtract(target);
        if (tileBounds.height < 0.5 || tileBounds.width < 0.5) {
            return null;
        }

        const drawAtRegion = target.subtract(raster.tile);
        const composition: Composition = {
            getBuffer: async (): Promise<Buffer> => Buffer.from((await img.getTile(x, y)).bytes),
            y: Math.max(0, Math.round(drawAtRegion.y)),
            x: Math.max(0, Math.round(drawAtRegion.x)),
        };

        // Sometimes the source image is smaller than the tile size,
        // Need to crop the tile down to the actual image extent
        if (source.width < img.tileSize.width) {
            composition.extract = { width: source.width, height: source.height };
        }

        // Often COG tiles do not align to the same size as XYZ Tiles
        // This will scale the COG tile to the same size as a XYZ
        if (source.width != target.width) {
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

    protected getTiles(tiff: CogTiff, x: number, y: number, z: number, logger: typeof Logger): Composition[] | null {
        const rasterBounds = this.getRasterTiffIntersection(tiff, x, y, z);
        if (rasterBounds == null) {
            return null;
        }
        logger.info({ inBounds: true }, 'TiffBoundsCheck');
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

        const tiffTileCount = (endX - startX) * (endY - startY);
        logger.info({ tiffTileCount, tiffTileUsed: composites.length }, 'TiffInBounds');

        if (composites.length === 0) {
            return null;
        }
        return composites;
    }
}

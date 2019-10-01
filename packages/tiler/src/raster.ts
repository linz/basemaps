import { Logger, LambdaSession } from '@basemaps/shared';
import { BoundingBox, Size } from '@basemaps/shared/build/bounds';
import * as Sharp from 'sharp';

export interface Composition {
    /** Image buffer */
    getBuffer: () => Promise<Buffer>;
    /** Point to draw the image at on the output bounds */
    x: number;
    y: number;
    /** Crop the initial bounds */
    extract?: Size;
    /** Resize the buffer */
    resize?: Size;
    /** Crop after the resize */
    crop?: BoundingBox;
}

export type SharpOverlay = { input: string | Buffer } & Sharp.OverlayOptions;

const SharpScaleOptions = { fit: Sharp.fit.cover };

export class Raster {
    private tileSize: number;

    public constructor(tileSize: number) {
        this.tileSize = tileSize;
    }

    public async compose(composition: Composition[], logger: typeof Logger): Promise<Buffer> {
        const sharp = this.createImage();

        const timer = LambdaSession.get().timer;
        // TODO to prevent too many of these running, it should ideally be inside of a two step promise queue
        // 1. Load all image bytes
        // 2. Create image overlays
        timer.start('compose:overlay');
        const overlays = await Promise.all(composition.map(this.composeTile.bind(this)));
        const overlayDuration = timer.end('compose:overlay');

        timer.start('compose:compress');
        const output = await sharp
            .composite(overlays)
            .png() // TODO should we configure output options (eg WebP/Png/Jpeg)
            .toBuffer();
        const compressDuration = timer.end('compose:compress');
        logger.info({ compressDuration, overlayDuration }, 'TileCompose');

        return output;
    }

    private async composeTile(composition: Composition): Promise<SharpOverlay> {
        const bytes = await composition.getBuffer();
        const sharp = Sharp(Buffer.from(bytes));

        if (composition.extract) {
            sharp.extract({ top: 0, left: 0, width: composition.extract.width, height: composition.extract.height });
        }

        if (composition.resize) {
            sharp.resize(composition.resize.width, composition.resize.height, SharpScaleOptions);
        }

        if (composition.crop) {
            sharp.extract({
                top: composition.crop.y,
                left: composition.crop.x,
                width: composition.crop.width,
                height: composition.crop.height,
            });
        }

        const input = await sharp.toBuffer();
        return {
            input,
            top: composition.y,
            left: composition.x,
        };
    }

    private createImage(): Sharp.Sharp {
        return Sharp({
            create: {
                width: this.tileSize,
                height: this.tileSize,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        });
    }
}

import { BoundingBox, Size } from '@basemaps/geo';
import * as Sharp from 'sharp';
import { TileMaker } from '@basemaps/tiler';
import { Metrics } from '@basemaps/metrics';

export interface Composition {
    /** Tiff Id */
    id: string;
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

export class TileMakerSharp implements TileMaker {
    private tileSize: number;
    /** The background of all tiles that are created */
    public background = { r: 0, g: 0, b: 0, alpha: 0 };

    public constructor(tileSize: number) {
        this.tileSize = tileSize;
    }

    public async compose(composition: Composition[]): Promise<{ buffer: Buffer; metrics: Metrics }> {
        const sharp = this.createImage();
        const metrics = new Metrics();
        // TODO to prevent too many of these running, it should ideally be inside of a two step promise queue
        // 1. Load all image bytes
        // 2. Create image overlays
        metrics.start('compose:overlay');
        const todo: Promise<SharpOverlay>[] = [];
        for (const comp of composition) {
            todo.push(this.composeTile(comp));
        }
        const overlays = await Promise.all(todo);
        metrics.end('compose:overlay');

        metrics.start('compose:compress');
        const buffer = await sharp
            .composite(overlays)
            .png() // TODO should we configure output options (eg WebP/Png/Jpeg)
            .toBuffer();

        metrics.end('compose:compress');

        return { buffer, metrics };
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
                background: this.background,
            },
        });
    }
}

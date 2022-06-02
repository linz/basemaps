import ShelfPack from '@mapbox/shelf-pack';
import Sharp from 'sharp';

export interface SvgId {
  /** Unique id for the sprite */
  id: string;
  /** Sprite SVG as a buffer */
  svg: Buffer;
}

export interface SpriteSheetLayout {
  [id: string]: { width: number; height: number; x: number; y: number; pixelRatio: number };
}

export interface SpriteSheetResult {
  /** Pixel ratio that was used to generate the sprite sheet */
  pixelRatio: number;
  /** Layout to where the sprites were placed */
  layout: SpriteSheetLayout;
  /** PNG buffer of the sprite sheet */
  buffer: Buffer;
}

export type SpriteLoaded = {
  width: number;
  height: number;
} & SvgId;

function heightAscThanNameComparator(a: { height: number; id: string }, b: { height: number; id: string }): number {
  return b.height - a.height || (a.id === b.id ? 0 : a.id < b.id ? -1 : 1);
}

export const Sprites = {
  async generate(source: SvgId[], pixelRatio: readonly number[]): Promise<SpriteSheetResult[]> {
    const imageData: SpriteLoaded[] = [];
    const imageById = new Map<string, SpriteLoaded>();
    for (const img of source) {
      const metadata = await Sharp(img.svg).metadata();
      if (metadata.width == null || metadata.height == null) throw new Error('Unable to get width of image: ' + img.id);
      if (imageById.has(img.id)) throw new Error('Duplicate sprite id ' + img.id);
      const data = { width: metadata.width, height: metadata.height, id: img.id, svg: img.svg };
      imageById.set(img.id, data);
      imageData.push(data);
    }

    imageData.sort(heightAscThanNameComparator);
    const sprite = new ShelfPack(1, 1, { autoResize: true });
    const sprites = sprite.pack(imageData);

    const sheets = pixelRatio.map(async (px): Promise<SpriteSheetResult> => {
      const outputImage = Sharp({
        create: {
          width: sprite.w * px,
          height: sprite.h * px,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      });

      const layout: SpriteSheetLayout = {};
      const composite: Sharp.OverlayOptions[] = [];
      for (const sprite of sprites) {
        const spriteData = imageById.get(String(sprite.id));
        if (spriteData == null) throw new Error('Cannot find sprite: ' + sprite.id);
        composite.push({
          input: await Sharp(spriteData.svg)
            .resize({ width: sprite.w * px })
            .toBuffer(),
          top: sprite.y * px,
          left: sprite.x * px,
        });
        layout[sprite.id] = {
          width: sprite.w * px,
          height: sprite.h * px,
          x: sprite.x * px,
          y: sprite.y * px,
          pixelRatio: px,
        };
      }

      const buffer = await outputImage.composite(composite).png({ palette: true, compressionLevel: 9 }).toBuffer();
      return { buffer, pixelRatio: px, layout };
    });

    return await Promise.all(sheets);
  },
};

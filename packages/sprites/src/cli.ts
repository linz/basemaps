/* eslint-disable no-console */
import { command, multioption, flag, number, restPositionals, array, string } from 'cmd-ts';
import path from 'path';
import { listSprites, ValidExtensions } from './fs.js';
import { Sprites } from './sprites.js';
import { promises as fs } from 'fs';

export const SpriteCli = command({
  name: 'basemaps-sprites',
  description: 'Create a sprite sheet from a folder of sprites',
  args: {
    ratio: multioption({ long: 'ratio', type: array(number), description: 'Pixel ratios to use, default: 1, 2' }),
    retina: flag({ long: 'retina', defaultValue: () => false, description: 'Double the pixel ratio' }),
    paths: restPositionals({ description: 'Path to sprites' }),
    extensions: multioption({
      long: 'extension',
      type: array(string),
      description: 'File extensions to use, default: .svg',
    }),
  },
  handler: async (args) => {
    if (args.paths.length === 0) throw new Error('No sprite paths supplied');
    if (args.ratio.length === 0) args.ratio.push(1, 2);

    if (args.extensions.length > 0) ValidExtensions.clear();
    for (const ext of args.extensions) {
      const extName = ext.toLowerCase();
      if (extName.startsWith('.')) ValidExtensions.add(extName);
      else ValidExtensions.add(`.${extName}`);
    }

    const result = await buildSprites(args.ratio, args.retina, args.paths);

    for (const r of result) {
      console.log('Write', r.sprites, 'sprites to', r.path, { ratio: r.ratio });
    }
    console.log('Done');
  },
});

export interface SpriteStats {
  /** Sprite sheet name */
  sheet: string;
  /** Number of sprites found */
  sprites: number;
  /** Pixel ratio */
  ratio: number;
  /** Output location */
  path: string;
  /**
   * Pixel ratio scale, will be empty if ratio is 1
   * @example "@2x" or "@3x"
   */
  scale: string;
}
export async function buildSprites(
  ratio: number[],
  retina: boolean,
  paths: string[],
  output?: string,
): Promise<SpriteStats[]> {
  if (ratio.length === 0) ratio.push(1, 2);

  let baseRatio = 1;
  if (retina) {
    baseRatio = 2;
    for (let i = 0; i < ratio.length; i++) ratio[i] = ratio[i] * 2;
  }

  const stats: SpriteStats[] = [];

  for (const spritePath of paths) {
    const sheetName = path.basename(spritePath);
    const sprites = await listSprites(spritePath);
    const results = await Sprites.generate(sprites, ratio);

    for (const res of results) {
      const scaleText = res.pixelRatio / baseRatio === 1 ? '' : `@${res.pixelRatio / baseRatio}x`;
      let outputPath = `${sheetName}${scaleText}`;
      if (output != null) {
        await fs.mkdir(output, { recursive: true });
        outputPath = path.join(output, outputPath);
      }

      await fs.writeFile(`${outputPath}.json`, JSON.stringify(res.layout, null, 2));
      await fs.writeFile(`${outputPath}.png`, res.buffer);
      stats.push({
        sheet: sheetName,
        path: outputPath,
        sprites: sprites.length,
        ratio: res.pixelRatio,
        scale: scaleText,
      });
    }
  }

  return stats;
}

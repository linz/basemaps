import { Sprites, SvgId } from '../sprites.js';
import { fsa } from '@chunkd/fs';
import { basename } from 'path';

// Validate the readme example actually compiles
export async function main(): Promise<void> {
  const sprites: SvgId[] = [];
  for await (const spritePath of fsa.list('./config/sprites')) {
    sprites.push({ id: basename(spritePath).replace('.svg', ''), buffer: await fsa.read(spritePath) });
  }

  const generated = await Sprites.generate(sprites, [1, 2, 4]);
  for (const res of generated) {
    const scaleText = res.pixelRatio === 1 ? '' : `@${res.pixelRatio}x`;
    const outputPng = `./sprites${scaleText}.png`;
    const outputJson = `./sprites${scaleText}.json`;

    await fsa.write(outputPng, res.buffer);
    await fsa.write(outputJson, JSON.stringify(res.layout, null, 2));
  }
}

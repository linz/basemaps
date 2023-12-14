import { fsa } from '@basemaps/shared';
import { basename } from 'path';

import { Sprites, SvgId } from '../sprites.js';

// Validate the readme example actually compiles
export async function main(): Promise<void> {
  const sprites: SvgId[] = [];
  for await (const spritePath of fsa.list(fsa.toUrl('./config/sprites'))) {
    sprites.push({ id: basename(spritePath.pathname).replace('.svg', ''), buffer: await fsa.read(spritePath) });
  }

  const generated = await Sprites.generate(sprites, [1, 2, 4]);
  for (const res of generated) {
    const scaleText = res.pixelRatio === 1 ? '' : `@${res.pixelRatio}x`;
    const outputPng = fsa.toUrl(`./sprites${scaleText}.png`);
    const outputJson = fsa.toUrl(`./sprites${scaleText}.json`);

    await fsa.write(outputPng, res.buffer);
    await fsa.write(outputJson, JSON.stringify(res.layout, null, 2));
  }
}

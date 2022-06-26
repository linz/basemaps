# @basemaps/sprites

Generate a sprite sheet from a list of sprites

# Using the API

```typescript
import { Sprites, SvgId } from '@basemaps/sprites';
import { fsa } from '@chunkd/fs';
import { basename } from 'path';

const sprites: SvgId[] = [];
for await (const spritePath of fsa.list('./config/sprites')) {
  sprites.push({ id: basename(spritePath).replace('.svg', ''), svg: await fsa.read(spritePath) });
}

const generated = await Sprites.generate(sprites, [1, 2, 4]);
for (const res of generated) {
  const scaleText = res.pixelRatio === 1 ? '' : `@${res.pixelRatio}x`;
  const outputPng = `./sprites${scaleText}.png`;
  const outputJson = `./sprites${scaleText}.json`;

  await fsa.write(outputPng, res.buffer);
  await fsa.write(outputJson, JSON.stringify(res.layout, null, 2));
}
```

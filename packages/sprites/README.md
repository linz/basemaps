# @basemaps/sprites

Generate a sprite sheet from a list of sprites

# Using the API

```typescript
import { Sprites, SvgId } from '@basemaps/sprites';
import { fsa } from '@chunkd/fs';
import { basename } from 'path';

const sprites: SvgId[] = [];
for await (const spritePath of fsa.list('./config/sprites')) {
  if (!spritePath.endsWith('.svg')) continue;
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
```

# From the command line

```
npm install -g @basemaps/sprites

basemaps-sprites --ratio 1 --ratio 2 --retina ./config/sprites/topographic
```

Outputs:

topographic.json
topographic.png

topographic@2x.json
topographic@2x.png

Sprites can also be in other formats such as PNG or WebP

```
# Load only png sprites
basemaps-sprites --extension .png ./config/sprites/topographic

# Load png, webp and svg sprites
basemaps-sprites --extension .png --extension .svg --extension .webp ./config/sprites/topographic
```

# Refference of the test sprites in the unit tests.

The following test sprites come from [openstreetmap-americana](https://github.com/zelonewolf/openstreetmap-americana)

- ./static/sprites/openstreetmap_poi_bus.svg
- ./static/sprites/openstreetmap_poi_plane.svg
- ./static/sprites/openstreetmap_shield_ca_qc_a_2.svg
- ./static/sprites/openstreetmap_shield_kr_expressway_2.svg
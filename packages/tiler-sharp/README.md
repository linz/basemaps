# @basemaps/tiler-sharp

Module contains the functions to support xyz tile server to generate tiles by using sharp.

```typescript
const res = await compose({
      layers, // all the tiles using to create the new one.
      format: 'webp',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      resizeKernel: { in: 'lanczos3', out: 'lanczos3' },
    });
```

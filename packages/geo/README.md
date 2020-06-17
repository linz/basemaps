# @basemaps/geo

Utility functions to work with QuadKeys, Tiles and Projections.

## Bounds and intersections

```typescript
import { Bounds } from '@basemaps/geo';

const bounds = new Bounds(128, 128, 256, 256);
const boundsB = new Bounds(0, 0, 256, 256);

bounds.intersects(boundsB); // true

bounds.intersection(boundsB) // { x: 128, y: 128, width: 128, height: 128}
```

## Typing for generic point and sizes

```typescript
import { Point, Size, BoundingBox } from '@basemaps/geo'

const p: Point = { x: 5, y: 5 };
const s: Size = { width: 200, height: 500 };
const box: BoundingBox = { ...p, ...s };
```

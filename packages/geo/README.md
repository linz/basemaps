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

## QuadKey utilities

```typescript
import {QuadKey} from '@basemaps/geo';


QuadKey.children('3') // ['30', '31', '32', '33']

QuadKey.fromTile({ x: 3, y: 2, z: 2 } // '31'
```

## Tile Matrix Sets


```typescript
import {GoogleTms} from '@basemaps/geo/build/tms/google'


/** Convert tile offsets into pixel coordinates */
GoogleTms.tileToPixels(1, 1) // { x: 256, y: 256 }

/** Convert a tile into the upper left point in Google  */
GoogleTms.tileToSource({ x: 0, y: 0, z: 0 }) // { x: -20037508.3427892, y: 20037508.3427892 }
```


## Epsg Helpers

```typescript
import {Epsg} from '@basemaps/geo'


Epsg.Google.toEpsgCode() // `EPSG:3857`
Epsg.Google.toUrn() // `urn:ogc:def:crs:EPSG:3857`
Epsg.parse('3857') // Epsg.Google
Epsg.get(3857) // Epsg.Google
```
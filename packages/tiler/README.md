# @basemaps/tiler

Given a collection of CogGeoTiffs, generate the composition pipeline required to create a XYZ WebMercator tile

See `@basemaps/tiler-sharp` for how to run the composition pipeline in NodeJs

## Usage

```typescript
import {Tiler} from '@basemaps/tiler'
const tiler = new Tiler(256 /* Tile size px */);
const tiffs = [tiffA,tiffB]; // @cogeotiff/core GeoTiff's
const layers = await tiler.tile(tiffs, x, y, z);
// Layers is now the positioning and scaling information for the tiffs

import {TilerMaker} from '@basemaps/tiler-sharp'
const maker = new TileMaker(256);
const data = await maker.compose(layers)
console.log(data.buffer) // PNG image of the resulting layers

```

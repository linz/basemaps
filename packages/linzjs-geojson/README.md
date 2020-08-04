# GeoJSON computation

Utility functions for working with GeoJSON multi polygons and bounding boxes. In particular for handling the anti-meridian.

## Usage


### Wgs84
```javascript
import { Wgs84 } from '@linzjs/geojson';

assert(Wgs84.normLon(-163.12345 - 720) == -163.12345;

assert(Wgs84.crossesAM(-175, 175));

assert(Wgs84.delta(-175, 170) == -15);

assert(deepEqual(Wgs84.union([175, -42, -178, -41], [-170, -43, -160, -42]), [175, -43, -160, -41]));
```

### MultiPolygon

```javascript
import { clipMultipolygon,  multiPolygonToWgs84 } from '@linzjs/geojson';
import Proj from 'proj4';

// polygons clipped to bounding box; no degenerate edges
const clipped = clipMultipolygon(polygons, [-2, -2, 1, 1]);

const nztmToWgs84 = Proj('epsg:2193', 'epsg:4326').forward;

// nztm polygons converted to wgs84 split at anti-meridian
const splitPolys = multiPolygonToWgs84(nztmPolygons, nztmToWgs84);
```

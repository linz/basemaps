# @basemaps/attribution

Library to determine to applicable attribution for a given extent and zoom level.

## Usage

```bash
npm install @basemaps/attribution
```

```js
import { Attribution } from '@basemaps/attribution';

const attributions = await Attribution.load('https://basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:3857/attribution.json?api=...');

// Find all imagery sets inside the following bounding box
const attrList = attributions.filter([144.7377202, -45.8938181, 195.62639, -37.65336], 6);

// Convert the attrubtion list to a human readable description
const description = attributions.renderList(attrList);
// "NZ 10m Satellite Imagery (2020-2021) & GEBCO 2020 Grid"
```

Using a CDN see https://basemaps.linz.govt.nz/examples/index.openlayers.attribution.wmts.3857.html.

## License

This system is licensed under the MIT License, except where otherwise specified. See the [LICENSE](https://github.com/linz/basemaps/blob/master/LICENSE) file for more details.

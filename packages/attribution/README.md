# @basemaps/attribution

Library to determine to applicable attribution for a given extent and zoom level.

## Usage

```bash
npm install @basemaps/attribution
```

```js
import { Attribution } from '@basemaps/attribution';

const attributions = await attributions.load(attrURL);

const attrList = attributions.filter([19455725.1, -5053732.8, 19456330.7, -5053278.8], 17)));
const description = attributions.renderList(attrList);
```

Using a CDN see https://basemaps.linz.govt.nz/examples/index.openlayers.attribution.wmts.3857.html.

## License

This system is licensed under the MIT License, except where otherwise specified. See the [LICENSE](https://github.com/linz/basemaps/blob/master/LICENSE) file for more details.

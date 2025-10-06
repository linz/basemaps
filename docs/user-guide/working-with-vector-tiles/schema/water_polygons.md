# water_polygons

This layer contains water-related features represented as `Polygon` geometries. Such features include reefs, reservoirs, and shoals.

!!! Default

    This is a default [Shortbread](https://shortbread-tiles.org/schema/1.0/#layer-water_polygons) layer.

## all

#### Filter

`["all"]`

#### Attributes

<table>
  <thead>
    <tr>
      <th style="white-space: nowrap">Name</th>
      <th style="white-space: nowrap">Type</th>
      <th>Value(s)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="white-space: nowrap">height</td>
      <td style="white-space: nowrap"><code>number | undefined</code></td>
      <td>56</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>marine_farm, reef, reservoir, river, shoal, stream, water, waterfall</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">lid_type</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>covered</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">species</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>mussels</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">water</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>lagoon, lake</td>
    </tr>
  </tbody>
</table>

#### Properties

<table>
  <thead>
    <tr>
      <th>Geometries</th>
      <th>Min Zoom</th>
      <th>Max Zoom</th>
    </tr>
  </thead>
    <tbody>
    <tr>
      <td>Polygon</td>
      <td>0</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

## kinds

### marine_farm

#### Filter

`["all", ["==", "kind", "marine_farm"]]`

#### Attributes

<table>
  <thead>
    <tr>
      <th style="white-space: nowrap">Name</th>
      <th style="white-space: nowrap">Type</th>
      <th>Value(s)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>marine_farm</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">species</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>mussels</td>
    </tr>
  </tbody>
</table>

#### Properties

<table>
  <thead>
    <tr>
      <th>Geometries</th>
      <th>Min Zoom</th>
      <th>Max Zoom</th>
    </tr>
  </thead>
    <tbody>
    <tr>
      <td>Polygon</td>
      <td>12</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### reef

#### Filter

`["all", ["==", "kind", "reef"]]`

#### Attributes

<table>
  <thead>
    <tr>
      <th style="white-space: nowrap">Name</th>
      <th style="white-space: nowrap">Type</th>
      <th>Value(s)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>reef</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>Aotea Reef, Atiu, Fairchild Reef, Jacksons Reef / Patuatini, Manuae, Motu Oneone, North-East Reef (Terangi-taumaewa), Northwest Reef, Okaparu Reef, Piritoki Reef, Renweeks Reef, South reef, Taki-a-Maru / Fish Reef, Tuhua Reef</td>
    </tr>
  </tbody>
</table>

#### Properties

<table>
  <thead>
    <tr>
      <th>Geometries</th>
      <th>Min Zoom</th>
      <th>Max Zoom</th>
    </tr>
  </thead>
    <tbody>
    <tr>
      <td>Polygon</td>
      <td>1</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### reservoir

#### Filter

`["all", ["==", "kind", "reservoir"]]`

#### Attributes

<table>
  <thead>
    <tr>
      <th style="white-space: nowrap">Name</th>
      <th style="white-space: nowrap">Type</th>
      <th>Value(s)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>reservoir</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">lid_type</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>covered</td>
    </tr>
  </tbody>
</table>

#### Properties

<table>
  <thead>
    <tr>
      <th>Geometries</th>
      <th>Min Zoom</th>
      <th>Max Zoom</th>
    </tr>
  </thead>
    <tbody>
    <tr>
      <td>Polygon</td>
      <td>10</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### river

#### Filter

`["all", ["==", "kind", "river"]]`

#### Attributes

<table>
  <thead>
    <tr>
      <th style="white-space: nowrap">Name</th>
      <th style="white-space: nowrap">Type</th>
      <th>Value(s)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>river</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
  </tbody>
</table>

#### Properties

<table>
  <thead>
    <tr>
      <th>Geometries</th>
      <th>Min Zoom</th>
      <th>Max Zoom</th>
    </tr>
  </thead>
    <tbody>
    <tr>
      <td>Polygon</td>
      <td>9</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### shoal

#### Filter

`["all", ["==", "kind", "shoal"]]`

#### Attributes

<table>
  <thead>
    <tr>
      <th style="white-space: nowrap">Name</th>
      <th style="white-space: nowrap">Type</th>
      <th>Value(s)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>shoal</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
  </tbody>
</table>

#### Properties

<table>
  <thead>
    <tr>
      <th>Geometries</th>
      <th>Min Zoom</th>
      <th>Max Zoom</th>
    </tr>
  </thead>
    <tbody>
    <tr>
      <td>Polygon</td>
      <td>12</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### stream

#### Filter

`["all", ["==", "kind", "stream"]]`

#### Attributes

<table>
  <thead>
    <tr>
      <th style="white-space: nowrap">Name</th>
      <th style="white-space: nowrap">Type</th>
      <th>Value(s)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>stream</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>Boulder Rapid, Double Staircase, Fan Rapid, Hamilton Rapids, Helicopter Rapid, Hells Gate Rapids, Ngaawapurua Rapids, Nihootekiore Rapids, Paraua Rapids, Sonny's Revenge, Takakihi Rapids, Tarakena Rapids, The Shute, Wharetamore Rapids, White Rapid</td>
    </tr>
  </tbody>
</table>

#### Properties

<table>
  <thead>
    <tr>
      <th>Geometries</th>
      <th>Min Zoom</th>
      <th>Max Zoom</th>
    </tr>
  </thead>
    <tbody>
    <tr>
      <td>Polygon</td>
      <td>12</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### water

#### Filter

`["all", ["==", "kind", "water"]]`

#### Attributes

<table>
  <thead>
    <tr>
      <th style="white-space: nowrap">Name</th>
      <th style="white-space: nowrap">Type</th>
      <th>Value(s)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>water</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">water</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>lagoon, lake</td>
    </tr>
  </tbody>
</table>

#### Properties

<table>
  <thead>
    <tr>
      <th>Geometries</th>
      <th>Min Zoom</th>
      <th>Max Zoom</th>
    </tr>
  </thead>
    <tbody>
    <tr>
      <td>Polygon</td>
      <td>0</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### waterfall

#### Filter

`["all", ["==", "kind", "waterfall"]]`

#### Attributes

<table>
  <thead>
    <tr>
      <th style="white-space: nowrap">Name</th>
      <th style="white-space: nowrap">Type</th>
      <th>Value(s)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="white-space: nowrap">height</td>
      <td style="white-space: nowrap"><code>number</code></td>
      <td>56</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>waterfall</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>Alice Falls</td>
    </tr>
  </tbody>
</table>

#### Properties

<table>
  <thead>
    <tr>
      <th>Geometries</th>
      <th>Min Zoom</th>
      <th>Max Zoom</th>
    </tr>
  </thead>
    <tbody>
    <tr>
      <td>Polygon</td>
      <td>12</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

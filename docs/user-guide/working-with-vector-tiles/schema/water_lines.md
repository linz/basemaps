# water_lines

This layer contains water-related features represented as `LineString` geometries. Such features include rivers, streams, and waterfalls.

!!! Default

    This is a default [Shortbread](https://shortbread-tiles.org/schema/1.0/#layer-water_lines) layer.

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
      <td style="white-space: nowrap">feature</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>edge</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">height</td>
      <td style="white-space: nowrap"><code>number | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>boom, drain, flume, marine_farm, river, stream, water_race, waterfall, wharf, wharf_edge</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">species</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>salmon</td>
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
      <td>LineString</td>
      <td>8</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

## kinds

### boom

#### Filter

`["all", ["==", "kind", "boom"]]`

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
      <td>boom</td>
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
      <td>LineString</td>
      <td>12</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### drain

#### Filter

`["all", ["==", "kind", "drain"]]`

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
      <td>drain</td>
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
      <td>LineString</td>
      <td>10</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### flume

#### Filter

`["all", ["==", "kind", "flume"]]`

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
      <td>flume</td>
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
      <td>LineString</td>
      <td>12</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

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
      <td>salmon</td>
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
      <td>LineString</td>
      <td>12</td>
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
      <td>LineString</td>
      <td>8</td>
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
      <td>Bullivants Cascade, Churn Rapids, Gold Smith Rapids, Mahuia Rapids, Motutoa Rapids, Selwyn Rapids, Staircase Rapids, Takapou O Hinewai Cascade, Tauanui Rapids, The Companion Ladder Rapids, The Slot</td>
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
      <td>LineString</td>
      <td>12</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### water_race

#### Filter

`["all", ["==", "kind", "water_race"]]`

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
      <td>water_race</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>Argyll Water Race, Ashcott Water Race, Cardrona Company Water Race, Forest Gate Water Race, Lindsay Water Race, Mount Ida Water Race, Surprise Water Race</td>
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
      <td>LineString</td>
      <td>12</td>
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
      <td style="white-space: nowrap">feature</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>edge</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">height</td>
      <td style="white-space: nowrap"><code>number</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>waterfall</td>
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
      <td>LineString</td>
      <td>12</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### wharf

#### Filter

`["all", ["==", "kind", "wharf"]]`

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
      <td>wharf</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>Birkenhead Wharf, Cornwallis Wharf, Dalys Wharf, Glade Wharf, Hanson Point Wharf, Islington Bay Wharf, Kaipara River Landing, Karaka Bay Wharf, Matiatia Wharf, Northcote Wharf, Orakei Wharf, Orapiu Wharf, Petone Wharf, Point Howard Wharf, Sandy Bay Wharf, Seatoun Wharf, Seaview Wharf, Tiritiri Wharf, Town Wharf</td>
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
      <td>LineString</td>
      <td>10</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### wharf_edge

#### Filter

`["all", ["==", "kind", "wharf_edge"]]`

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
      <td>wharf_edge</td>
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
      <td>LineString</td>
      <td>10</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

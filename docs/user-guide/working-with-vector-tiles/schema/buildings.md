# buildings

This layer contains building features represented as `Polygon` geometries.

!!! Default

    This is a default [Shortbread](https://shortbread-tiles.org/schema/1.0/#layer-buildings) layer.

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
      <td style="white-space: nowrap">building</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>storage_tank</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>building</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">store_item</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>fuel, water</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">use</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>Hospital, Hut, School, Shelter, Supermarket, Unknown</td>
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

## kinds

### building

#### Filter

`["all", ["==", "kind", "building"]]`

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
      <td>building</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">use</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>Hospital, Hut, School, Shelter, Supermarket, Unknown</td>
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
      <td>14</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

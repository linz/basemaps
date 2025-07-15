# street_polygons


_No description._


!!! Default

    This is a default [Shortbread](https://shortbread-tiles.org/schema/1.0/#layer-street_polygons) layer.


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
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>aerodrome, runway</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">surface</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>sealed</td>
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
      <td>5</td>
      <td>15</td>
    </tr>
    </tbody>
</table>


## kinds


### aerodrome

#### Filter

`["all", ["==", "kind", "aerodrome"]]`

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
      <td>aerodrome</td>
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
      <td>5</td>
      <td>15</td>
    </tr>
    </tbody>
</table>


### runway

#### Filter

`["all", ["==", "kind", "runway"]]`

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
      <td>runway</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">surface</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>sealed</td>
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



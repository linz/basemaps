# contours

This layer contains contour line interval features represented as `LineString` geometries, and height peak features represents as `Point` geometries.


!!! example "Custom"

    This is a custom Shortbread layer.



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
      <td style="white-space: nowrap">designated</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>supplementary</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">elevation</td>
      <td style="white-space: nowrap"><code>number | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>contours, peak</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">nat_form</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>depression</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">rank</td>
      <td style="white-space: nowrap"><code>number | undefined</code></td>
      <td>1, 2, 3, 4, 5</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">type</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>index</td>
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
      <td>LineString, Point</td>
      <td>9</td>
      <td>15</td>
    </tr>
    </tbody>
</table>


## kinds


### contours

#### Filter

`["all", ["==", "kind", "contours"]]`

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
      <td style="white-space: nowrap">designated</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>supplementary</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">elevation</td>
      <td style="white-space: nowrap"><code>number</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>contours</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">nat_form</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>depression</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">type</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>index</td>
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
      <td>9</td>
      <td>15</td>
    </tr>
    </tbody>
</table>


### peak

#### Filter

`["all", ["==", "kind", "peak"]]`

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
      <td style="white-space: nowrap">elevation</td>
      <td style="white-space: nowrap"><code>number | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>peak</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">rank</td>
      <td style="white-space: nowrap"><code>number | undefined</code></td>
      <td>1, 2, 3, 4, 5</td>
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
      <td>Point</td>
      <td>11</td>
      <td>15</td>
    </tr>
    </tbody>
</table>



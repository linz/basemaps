# streets


_No description._


!!! Default

    This is a default [Shortbread](https://shortbread-tiles.org/schema/1.0/#layer-streets) layer.


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
      <td style="white-space: nowrap">bridge</td>
      <td style="white-space: nowrap"><code>boolean | undefined</code></td>
      <td>true</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">hway_num</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>motorway, primary, raceway, rail, secondary, track</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">lane_count</td>
      <td style="white-space: nowrap"><code>number | undefined</code></td>
      <td>1, 2, 3, 4, 5, 6, 7</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">ref</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">rway_use</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>siding</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">status</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>closed, derelict, disused, historic, under construction, unmaintained</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">subclass</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>cycle only, foot, foot_closed, foot_connector, foot_route, foot_route_closed, foot_routeroute, vehicle, vehicle_closed, vehicle_unmaintained</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">surface</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>metalled, sealed, unmetalled</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">track_type</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>connector, multiple, route, routeroute, single, training</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">track_use</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>cycle, cycle only, dog, foot, horse, vehicle</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">tunnel</td>
      <td style="white-space: nowrap"><code>boolean | undefined</code></td>
      <td>true</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">use_1</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>cablecar, farm, foot traffic, train, vehicle</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">use_2</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>train</td>
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
      <td>0</td>
      <td>15</td>
    </tr>
    </tbody>
</table>


## kinds


### motorway

#### Filter

`["all", ["==", "kind", "motorway"]]`

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
      <td style="white-space: nowrap">hway_num</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>motorway</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">lane_count</td>
      <td style="white-space: nowrap"><code>number</code></td>
      <td>1, 2, 3, 4, 5, 6, 7</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">ref</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">surface</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>metalled, sealed</td>
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
      <td>2</td>
      <td>15</td>
    </tr>
    </tbody>
</table>


### primary

#### Filter

`["all", ["==", "kind", "primary"]]`

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
      <td>primary</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">lane_count</td>
      <td style="white-space: nowrap"><code>number</code></td>
      <td>4, 5, 6</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">status</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>under construction</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">surface</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>sealed, unmetalled</td>
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


### raceway

#### Filter

`["all", ["==", "kind", "raceway"]]`

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
      <td>raceway</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>Alexandra Park, Cooks Gardens, Hampton Downs Motorsports Park, Hawea Domain, Meremere Dirt Track Club, Moore Park Speedway, Oxford Motor Club, Ruapuna Park Raceway, Teretonga Motor Racing Circuit, Timaru Motor Raceway</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">track_type</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>training</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">track_use</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>cycle, dog, horse, vehicle</td>
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


### rail

#### Filter

`["all", ["==", "kind", "rail"]]`

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
      <td>rail</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">rway_use</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>siding</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">status</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>disused</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">track_type</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>multiple, single</td>
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
      <td>0</td>
      <td>15</td>
    </tr>
    </tbody>
</table>


### secondary

#### Filter

`["all", ["==", "kind", "secondary"]]`

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
      <td style="white-space: nowrap">bridge</td>
      <td style="white-space: nowrap"><code>boolean | undefined</code></td>
      <td>true</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>secondary</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">lane_count</td>
      <td style="white-space: nowrap"><code>number | undefined</code></td>
      <td>1, 2, 3</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">status</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>closed, derelict, disused, historic, under construction</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">surface</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>metalled, sealed, unmetalled</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">tunnel</td>
      <td style="white-space: nowrap"><code>boolean | undefined</code></td>
      <td>true</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">use_1</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>cablecar, farm, foot traffic, train, vehicle</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">use_2</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>train</td>
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


### track

#### Filter

`["all", ["==", "kind", "track"]]`

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
      <td>track</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">status</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>closed, unmaintained</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">subclass</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>cycle only, foot, foot_closed, foot_connector, foot_route, foot_route_closed, foot_routeroute, vehicle, vehicle_closed, vehicle_unmaintained</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">track_type</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>connector, route, routeroute</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">track_use</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>cycle only, foot, vehicle</td>
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



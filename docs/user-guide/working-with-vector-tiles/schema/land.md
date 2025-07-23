# land

This layer contains land-related features represented as `LineString` and `Polygon` geometries. `Polygon` features represent areas, such as forests or mangroves, while `LineString` features delineate vectors such as cliffs or embankments.

!!! Default

    This is a default [Shortbread](https://shortbread-tiles.org/schema/1.0/#layer-land) layer.

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
      <td style="white-space: nowrap">distribution</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>scattered</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">embkmt_use</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>causeway, seawall, stopbank</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">landuse</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>forest, wood</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">species</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>non-coniferous</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">status</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>disused, historic, old</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">substance</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>clay, coal, gold, gravel, ironsand, lime, limestone, metal, shingle, silica sand, stone, zeolite</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">support_ty</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>pole, pylon</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">tree</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>exotic, native</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">visibility</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>opencast, underground</td>
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
      <td>Polygon, LineString</td>
      <td>0</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

## kinds

### bare_rock

#### Filter

`["all", ["==", "kind", "bare_rock"]]`

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
      <td>bare_rock</td>
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
      <td>14</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### boatramp

#### Filter

`["all", ["==", "kind", "boatramp"]]`

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
      <td>boatramp</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>boatramp, Namukulu Boat Ramp, Te Onepoto Boat Ramp</td>
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

### cemetery

#### Filter

`["all", ["==", "kind", "cemetery"]]`

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
      <td>cemetery</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>Akatarawa Cemetery, Auckland Memorial Park, CEM, Charlton Park Cemetery, Fairhall Cemetery, Makara Cemetery, Mangaroa Cemetery, Old Wanganui Cemetery, Omaka Cemetery, Porirua Cemetery, Taihape Cemetery, Taita Lawn Cemetery, Wharerangi Cemetery</td>
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

### cliff

#### Filter

`["all", ["==", "kind", "cliff"]]`

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
      <td>cliff</td>
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

### cutting

#### Filter

`["all", ["==", "kind", "cutting"]]`

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
      <td>cutting</td>
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

### dredge_tailing

#### Filter

`["all", ["==", "kind", "dredge_tailing"]]`

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
      <td>dredge_tailing</td>
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

### dry_dock

#### Filter

`["all", ["==", "kind", "dry_dock"]]`

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
      <td>dry_dock</td>
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

### embankment

#### Filter

`["all", ["==", "kind", "embankment"]]`

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
      <td style="white-space: nowrap">embkmt_use</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>causeway, seawall, stopbank</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>embankment</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>Tamehanas Dam</td>
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

### fence

#### Filter

`["all", ["==", "kind", "fence"]]`

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
      <td>fence</td>
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
      <td>13</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### forest

#### Filter

`["all", ["==", "kind", "forest"]]`

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
      <td>forest</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">landuse</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>forest, wood</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">species</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>non-coniferous</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">tree</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>exotic, native</td>
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

### golf_course

#### Filter

`["all", ["==", "kind", "golf_course"]]`

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
      <td>golf_course</td>
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
      <td>6</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### ice

#### Filter

`["all", ["==", "kind", "ice"]]`

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
      <td>ice</td>
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
      <td>2</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### ladder

#### Filter

`["all", ["==", "kind", "ladder"]]`

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
      <td>ladder</td>
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

### landfill

#### Filter

`["all", ["==", "kind", "landfill"]]`

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
      <td>landfill</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>Central Hawke's Bay Landfill, Rangitoto Quarry Landfill, Redvale Landfill, Silverstream Landfill, Whitford Landfill</td>
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

### mangrove

#### Filter

`["all", ["==", "kind", "mangrove"]]`

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
      <td>mangrove</td>
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

### mine

#### Filter

`["all", ["==", "kind", "mine"]]`

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
      <td>mine</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td><code>Too many values to list</code></td>
    </tr>
    <tr>
      <td style="white-space: nowrap">status</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>disused, historic, old</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">substance</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>coal, gold, ironsand</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">visibility</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>opencast</td>
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

### moraine

#### Filter

`["all", ["==", "kind", "moraine"]]`

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
      <td>moraine</td>
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

### moraine_wall

#### Filter

`["all", ["==", "kind", "moraine_wall"]]`

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
      <td>moraine_wall</td>
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

### mud

#### Filter

`["all", ["==", "kind", "mud"]]`

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
      <td>mud</td>
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

### orchard

#### Filter

`["all", ["==", "kind", "orchard"]]`

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
      <td>orchard</td>
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

### pipeline

#### Filter

`["all", ["==", "kind", "pipeline"]]`

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
      <td>pipeline</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">visibility</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>underground</td>
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

### pond

#### Filter

`["all", ["==", "kind", "pond"]]`

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
      <td>pond</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>Lake Crichton, pond, ponds</td>
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

### powerline

#### Filter

`["all", ["==", "kind", "powerline"]]`

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
      <td>powerline</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">support_ty</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>pole, pylon</td>
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

### quarry

#### Filter

`["all", ["==", "kind", "quarry"]]`

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
      <td>quarry</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">name</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>Castle Hill Station Quarry, Hatuma Limeworks, Horokiwi Quarry, Kaiaua Quarry, Kiwi Point Quarry, Macraes Mine, Marble Acre Quarry, Miles Bearly Pit, Otaika Quarry, Otokia Quarry, Pakohe Limeworks, Plimmerton Quarry, quarry, Tahuna Quarry, Te Puna Quarry, Waikakaho Quarry, Windy Point Quarry</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">status</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>disused</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">substance</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>clay, gravel, lime, limestone, metal, shingle, silica sand, stone, zeolite</td>
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

### residential

#### Filter

`["all", ["==", "kind", "residential"]]`

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
      <td>residential</td>
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
      <td>0</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### sand

#### Filter

`["all", ["==", "kind", "sand"]]`

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
      <td>sand</td>
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
      <td>8</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### scree

#### Filter

`["all", ["==", "kind", "scree"]]`

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
      <td>scree</td>
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

### scrub

#### Filter

`["all", ["==", "kind", "scrub"]]`

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
      <td style="white-space: nowrap">distribution</td>
      <td style="white-space: nowrap"><code>string | undefined</code></td>
      <td>scattered</td>
    </tr>
    <tr>
      <td style="white-space: nowrap">kind</td>
      <td style="white-space: nowrap"><code>string</code></td>
      <td>scrub</td>
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

### shingle

#### Filter

`["all", ["==", "kind", "shingle"]]`

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
      <td>shingle</td>
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

### siphon

#### Filter

`["all", ["==", "kind", "siphon"]]`

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
      <td>siphon</td>
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

### slip

#### Filter

`["all", ["==", "kind", "slip"]]`

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
      <td>slip</td>
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

### slipway

#### Filter

`["all", ["==", "kind", "slipway"]]`

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
      <td>slipway</td>
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

### swamp

#### Filter

`["all", ["==", "kind", "swamp"]]`

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
      <td>swamp</td>
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
      <td>2</td>
      <td>15</td>
    </tr>
    </tbody>
</table>

### telephone

#### Filter

`["all", ["==", "kind", "telephone"]]`

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
      <td>telephone</td>
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

### tree_row

#### Filter

`["all", ["==", "kind", "tree_row"]]`

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
      <td>tree_row</td>
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

### vineyard

#### Filter

`["all", ["==", "kind", "vineyard"]]`

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
      <td>vineyard</td>
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

### walkwire

#### Filter

`["all", ["==", "kind", "walkwire"]]`

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
      <td>walkwire</td>
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

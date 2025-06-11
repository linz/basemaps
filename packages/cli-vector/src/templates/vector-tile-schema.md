# {{name}}

{{#description}}
{{{description}}}
{{/description}}

{{^description}}
_No description._
{{/description}}

{{#isCustom}}
!!! example "Custom"

    This is a custom Shortbread layer.

{{/isCustom}}

{{^isCustom}}
!!! Default

    This is a default [Shortbread](https://shortbread-tiles.org/schema/1.0/#layer-{{name}}) layer.

{{/isCustom}}

## all

{{#all}}

#### Filter

`{{{filter}}}`

#### Attributes

{{#hasAttributes}}

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>Value(s)</th>
    </tr>
  </thead>
  <tbody>
    {{#attributes}}
    <tr>
      <td>{{name}}</td>
      <td>{{types}}</td>
      <td>{{{values}}}</td>
    </tr>
    {{/attributes}}
  </tbody>
</table>
{{/hasAttributes}}

{{^hasAttributes}}

_Features under this filter have no targetable attributes._

{{/hasAttributes}}

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
      <td>{{geometries}}</td>
      <td>{{zoom_levels.min}}</td>
      <td>{{zoom_levels.max}}</td>
    </tr>
    </tbody>
</table>

{{/all}}

## kinds

{{#kinds}}

### {{name}}

#### Filter

`{{{filter}}}`

#### Attributes

{{#hasAttributes}}

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>Value(s)</th>
    </tr>
  </thead>
  <tbody>
    {{#attributes}}
    <tr>
      <td>{{name}}</td>
      <td>{{types}}</td>
      <td>{{{values}}}</td>
    </tr>
    {{/attributes}}
  </tbody>
</table>
{{/hasAttributes}}

{{^hasAttributes}}

_Features under this filter have no targetable attributes._

{{/hasAttributes}}

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
      <td>{{geometries}}</td>
      <td>{{zoom_levels.min}}</td>
      <td>{{zoom_levels.max}}</td>
    </tr>
    </tbody>
</table>

{{/kinds}}

{{^kinds}}

_This layer has no kinds._

{{/kinds}}

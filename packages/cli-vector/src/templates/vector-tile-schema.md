{{#layers}}

## Layer "{{name}}"

{{description}}

### Properties

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    {{#properties}}
    <tr>
      <td>{{name}}</td>
      <td>{{type}}</td>
      <td>{{description}}</td>
    </tr>
    {{/properties}}
  </tbody>
</table>

### Features

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>`kind`</th>
      <th>Geometry</th>
      <th>Zoom</th>
    </tr>
  </thead>
  <tbody>
    {{#features}}
    <tr>
      <td>{{name}}</td>
      <td>{{kind}}</td>
      <td>{{geometry}}</td>
      <td>{{zoom}}</td>
    </tr>
    {{/features}}
  </tbody>
</table>

{{/layers}}

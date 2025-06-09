{{#data}}

# Zoom - {{zoom}}

## Biggest Tile

| X             | Y             | Z             | Size             |
| ------------- | ------------- | ------------- | ----------------: |
| {{maxTile.x}} | {{maxTile.y}} | {{maxTile.z}} | {{maxTile.size}} |

## Distributions

| Distribution | Number Of Tiles | Percentage |
| ------------: | ---------------: | ----------: |
{{#distributions}}
| {{{distribution}}} | {{{tiles}}} | {{{percentage}}} |
{{/distributions}}

### Layers

| Layer Name | Number Of Features | Total Geometry Sizes | Total Attribute Sizes | Total Sizes |
| ---------- | ------------------: | --------------------: | ---------------------: | -----------: |
{{#layers}}
| {{{name}}} | {{{features}}} | {{{totalGeometry}}} |{{{totalAttributes}}} |{{{totalSize}}} |
{{/layers}}

{{/data}}
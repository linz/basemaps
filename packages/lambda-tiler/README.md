# @basemaps/lambda-tiler

Lambda server for xyz map generation to provide apis for serving both raster and vector map.

## APIs

All available APIs are defined in the [index.ts](./src/index.ts)

`Host: https://basemaps.linz.govt.nz/`

### Server APIs

Validate the server status, health, version which is using for the ci/cd.

- GET [/ping](./src/routes/ping.ts)
- GET [/v1/ping](./src/routes/ping.ts)
- GET [/version](./src/routes/version.ts)
- GET [/v1/version](./src/routes/version.ts)
- GET [/health](./src/routes/health.ts)
- GET [/v1/health](./src/routes/health.ts)

### xyz tile generation API

Get a tile from the xyz and format for map generation, support both vector and raster tileSet.

- GET [/v1/tiles/:tileSet/:tileMatrix/:z/:x/:y.:tileType](./src/routes/tile.xyz.ts)

Example:

```
/v1/tiles/topographic/WebMercatorQuad/2/1/1.pbf - Vector Tile
/v1/tiles/aerial/WebMercatorQuad/6/0/38.webp - Raster Tile
```

### Imagery Metadata API

Fetch the imagery metadata based on the imageryId

- GET [/v1/imagery/:imageryId/:fileName](./src/routes/imagery.ts)

Examples:

```
/v1/imagery/:imageryId/source.geojson - Source boudning boxes
/v1/imagery/:imageryId/covering.geojson - Output tile bounding boxes
/v1/imagery/:imageryId/cutline.geojson - Cutline used ont he imagery set
/v1/imagery/:imageryId/collection.json - STAC Collection
/v1/imagery/:imageryId/15-32659-21603.json - STAC Item
```

### Config APIs

Fetch the imagery and tile set configurations

- GET [/v1/config/:tileSet.json](./src/routes/config.ts)
- GET [/v1/config/:tileSet/:imageryId.json](./src/routes/config.ts)

### Sprite and Fonts APIs

To get the fonts and sprites for the vector map.

- GET [/v1/sprites/:spriteName](./src/routes/sprites.ts)
- GET [/v1/fonts.json](./src/routes/fonts.ts)
- GET [/v1/fonts/:fontStack/:range.pbf](./src/routes/fonts.ts)

### StyleJSON and TileJSON APIs

Get the style json and tile json for the vector map.

- GET [/v1/styles/:styleName.json](./src/routes/tile.style.json.ts)
- GET [/v1/tiles/:tileSet/:tileMatrix/tile.json](./src/routes/tile.json.ts)

### Preview APIs

Serve a preview of a imagery set

- GET [/v1/preview/:tileSet/:tileMatrix/:z/:lon/:lat](./src/routes/preview.ts)
- GET [/v1/@:location](./src/routes/preview.index.ts)
- GET [/@:location](./src/routes/preview.index.ts)

### Attribution APIs

Get attribution json for the map attributions.

- GET [/v1/tiles/:tileSet/:tileMatrix/attribution.json](./src/routes/attribution.ts)
- GET [/v1/attribution/:tileSet/:tileMatrix/summary.json](./src/routes/attribution.ts)

### WMTS Capabilities APIs

Get WMTS xml from the server to support QGIS and Arcgis

- GET [/v1/tiles/:tileSet/:tileMatrix/WMTSCapabilities.xml](./src/routes/tile.wmts.ts)
- GET [/v1/tiles/:tileSet/WMTSCapabilities.xml](./src/routes/tile.wmts.ts)
- GET [/v1/tiles/WMTSCapabilities.xml](./src/routes/tile.wmts.ts)


# @basemaps/lambda-tiler

Lambda server for xyz map generation to provide apis for serving both raster and vector map.

## APIs

`Host: https://basemaps.linz.govt.nz/`

### Server APIs

Validate the server status, health, version which is using for the ci/cd.

```typescript
handler.router.get('/ping', pingGet);
handler.router.get('/health', healthGet);
handler.router.get('/version', versionGet);
handler.router.get('/v1/ping', pingGet);
handler.router.get('/v1/health', healthGet);
handler.router.get('/v1/version', versionGet);
```

### xyz tile generation API

Get a tile from the xyz and format for map generation, support both vector and raster tileSet.

```typescript
handler.router.get('/v1/tiles/:tileSet/:tileMatrix/:z/:x/:y.:tileType', tileXyzGet);
```

Example:

```
/v1/tiles/topographic/WebMercatorQuad/2/1/1.pbf - Vector Tile
/v1/tiles/aerial/WebMercatorQuad/6/0/38.webp - Raster Tile
```

### Imagery Metadata API

Fetch the imagery metadata based on the imageryId

```typescript
handler.router.get('/v1/imagery/:imageryId/:fileName', imageryGet);
```

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

```typescript
handler.router.get('/v1/config/:tileSet.json', configTileSetGet);
handler.router.get('/v1/config/:tileSet/:imageryId.json', configImageryGet);
```

### Sprite and Fonts APIs

To get the fonts and sprites for the vector map.

```typescript
// Sprites
handler.router.get('/v1/sprites/:spriteName', spriteGet);

// Fonts
handler.router.get('/v1/fonts.json', fontList);
handler.router.get('/v1/fonts/:fontStack/:range.pbf', fontGet);
```

### StyleJSON and TileJSON APIs

Get the style json and tile json for the vector map.

```typescript
// StyleJSON
handler.router.get('/v1/styles/:styleName.json', styleJsonGet);

// TileJSON
handler.router.get('/v1/tiles/:tileSet/:tileMatrix/tile.json', tileJsonGet);
```

### Preview APIs

Serve a preview of a imagery set

```typescript
handler.router.get('/v1/preview/:tileSet/:tileMatrix/:z/:lon/:lat', tilePreviewGet);
handler.router.get('/v1/@:location', previewIndexGet);
handler.router.get('/@:location', previewIndexGet);
```

### Attribution APIs

Get attribution json for the map attributions.

```typescript
// Attribution
handler.router.get('/v1/tiles/:tileSet/:tileMatrix/attribution.json', tileAttributionGet);
handler.router.get('/v1/attribution/:tileSet/:tileMatrix/summary.json', tileAttributionGet);
```

### WMTS Capabilities APIs

Get WMTS xml from the server to support QGIS and Arcgis

```typescript
// WMTS Capabilities
handler.router.get('/v1/tiles/:tileSet/:tileMatrix/WMTSCapabilities.xml', wmtsCapabilitiesGet);
handler.router.get('/v1/tiles/:tileSet/WMTSCapabilities.xml', wmtsCapabilitiesGet);
handler.router.get('/v1/tiles/WMTSCapabilities.xml', wmtsCapabilitiesGet);
```

### Arcgis Vector APIs

Provide support to serve basemaps vector map in Arcgis

```typescript
// Arcgis Vector
handler.router.get('/v1/arcgis/rest/services/:tileSet/VectorTileServer', arcgisTileServerGet);
handler.router.post('/v1/arcgis/rest/services/:tileSet/VectorTileServer', OkResponse);
handler.router.get('/v1/arcgis/rest/services/:tileSet/VectorTileServer/root.json', arcgisStyleJsonGet);
handler.router.get('/v1/arcgis/rest/info', arcgisInfoGet);
```

## Configuration

Basemaps has two main components to its configuration

- Imagery - List of tiffs that make up a imagery set
- TileSet - List of imagery or vector layers that make up a output layer.

The configuration can be stored as individual AWS DynamoDB objects or can be stored as a bundled JSON object.

The configuration is generally generated directly from the source tiffs and associated STAC metadata using the [@basemaps/cli](../packages/cli/README.md) import process, with LINZ's specific configuration being stored in [linz/basemaps](https://github.com/linz/basemaps).

This allows the configuration objects to be somewhat short, below is a snippet from the [aerial](https://github.com/linz/basemaps-config/blob/master/config/tileset/aerial.json) tile set configuration which layers 100+ aerial imagery layers together.  

```json5
{
  // Raster or Vector layer
  "type": "raster",
  // all id's are prefixed by type eg 'ts_' is TileSet
  "id": "ts_aerial",
  // Human friendly name
  "title": "Aerial Imagery Basemap",
  "category": "Basemaps",
  // If there is no data create a background color as heax RGBA
  "background": "dce9edff",
  "layers": [
    {
       // Source location for EPSG:2193 Imagery
      "2193": "s3://linz-basemaps/2193/gebco_2020_Nztm2000Quad_305-75m/01F1BFJN8R8P7BXN3XTHC5MT5G",
      // Source location for EPSG:3857 Imagery
      "3857": "s3://linz-basemaps/3857/gebco_2020_305-75m/01EDMTM3P563P06TWYQAZRA9F6",
      // url/slug friendly name of the imagery set
      "name": "gebco-2020-305.75m",
      // At what level should the imagery be turned off
      "maxZoom": 15,
      // Human friendly name for the imagery
      "title": "GEBCO Gridded Bathymetry (2020)",
      "category": "Bathymetry"
    },
    ...
  ]
}
```

When this configuration is imported it will list all of the source locations looking for `collection.json` and `*.tiff|*.tif` files. 

### Dynamic configuration

Configuration can be stored as single JSON object in s3 and then passed directly to the basemaps service with `?config=s3://linz-basemaps/config/config-latest.json.gz` this allows basemaps to preview a configuration before being deployed.
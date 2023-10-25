# @basemaps/config

## Basemaps Configuration

To effectively serve tiles to users, all rendering processes must be kept in synch with the exact same configuration.

Basemaps stores its configuration into a single DynamoDB table and separates the configuration objects into

- Imagery - Configuration for a single imagery layer, including location of all the Cloud optimized geotiffs, bounding boxes
- Tile Sets - Configuration on how to merge imagery/vector layers together to serve out as a combined layer
- Style - Vector tile style configuration (Style.json)
- Provider - Configuration about the owner of the service

This configuration is generally stored as JSON files in a `linz/basemaps-config` repository to allow easy modification and then programmatically loaded into Basemaps Dynamodb table

For LINZ's implementation of this configuration see [linz/basemaps-config](https://github.com/linz/basemaps-config)

## Imagery Example

[ConfigImagery](./src/config/imagery)

```json
{
  "v": 1,
  "id": "im_01E8121FN71M0PNZ6VB87DW05Z",
  "name": "new_zealand_sentinel_2018-19_10m",
  "projection": 3857,
  "uri": "s3://linz-basemaps/3857/new_zealand_sentinel_2018-19_10m/01E8121FN71M0PNZ6VB87DW05Z",
  "year": 2018,
  "files": [
    {
      "height": 4892,
      "name": "13-8032-5113",
      "width": 4892,
      "x": 19254793.17314903,
      "y": -4980025.266835816
    }
  ]
}
```

## Tile Sets Example

[ConfigTileSet](./src/config/tile.set.ts)

```json
{
  "id": "ts_01H8JF29R6S2NT7QXNC7GK90D4",
  "type": "raster",
  "format": "webp",
  "name": "manawatu-whanganui-sn9158-1991-0.375m",
  "title": "Manawatū-Whanganui 0.375m SN9158 (1991)",
  "layers": [
    {
      "2193": "im_01H8JF29R6S2NT7QXNC7GK90D4",
      "maxZoom": 32,
      "minZoom": 0,
      "name": "manawatu-whanganui-sn9158-1991-0.375m",
      "title": "Manawatū-Whanganui 0.375m SN9158 (1991)"
    }
  ]
}
```

## Style Example

[ConfigVectorStyle](./src/config/vector.style.ts)

```json
{
  "id": "st_topographic",
  "name": "topographic",
  "style": {
    "id": "st_topographic",
    "glyphs": "/v1/fonts/{fontstack}/{range}.pbf",
    "layers": [
      {
        "id": "Background",
        "filter": ["all", ["==", "class", "dock"]],
        "layout": {
          "visibility": "visible"
        },
        "minzoom": 0,
        "paint": {
          "background-color": "rgba(184, 220, 242, 1)"
        },
        "type": "background"
      },
      {
        "id": "Landcover-Sand",
        "filter": ["all", ["==", "class", "sand"]],
        "layout": {
          "visibility": "visible"
        },
        "minzoom": 8,
        "paint": {
          "fill-color": "rgba(226, 226, 226, 0.75)"
        },
        "source": "LINZ Basemaps",
        "source-layer": "landcover",
        "type": "fill"
      }
    ]
  }
}
```

## Provider Example

[ConfigProvider](./src/config/provider.ts)

```json
{
  "id": "pv_linz",
  "name": "linz",
  "serviceIdentification": {
    "accessConstraints": "Basemap @ CC BY 4.0 Land Information New Zealand",
    "description": "National map tile service provided by Land Information New Zealand",
    "fees": "There are no fees associated with access via the web interface or API.",
    "title": "LINZ Basemaps Service"
  },
  "serviceProvider": {
    "contact": {
      "address": {
        "city": "Wellington",
        "country": "New Zealand",
        "deliveryPoint": "Land Information New Zealand",
        "email": "basemaps@linz.govt.nz",
        "postalCode": "6145"
      },
      "individualName": "LINZ Customer Support",
      "phone": "+64 4 4600110",
      "position": "Customer Support"
    },
    "name": "Land Information New Zealand",
    "site": "http://www.linz.govt.nz"
  }
}
```

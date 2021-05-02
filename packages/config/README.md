# Basemaps Configuration - @basemaps/config

To effectively serve tiles to users, all rendering processes must be kept in synch with the exact same configuration.

Basemaps's stores its configuration into a single DyanmoDB table and separates the configuration objects into 

- Imagery - Configuration for a single imagery layer, including location of all the Cloud optimised geotiffs, bouding boxes and 
- Tile Sets - Configuration on how to merge imagery/vector layers together to serve out as a combined layer
- Style - Vector tile style configuration (Style.json)
- Provider - Configuration about the owner of the service

This configuration is generally stored as JSON files in a git repository to allow easy modification and then programmatically loaded into basemaps's dynamodb table 

For LINZ's implementation of this configuration see [linz/basemaps-config](https://github.com/linz/basemaps-config)

# Imagery Example

[ConfigImagery](./src/config/imagery)
```json
{
  "v": 1,
  "id": "im_01E8121FN71M0PNZ6VB87DW05Z",
  "name": "new_zealand_sentinel_2018-19_10m",
  "projection": 3857,
  "uri": "s3://linz-basemaps/3857/new_zealand_sentinel_2018-19_10m/01E8121FN71M0PNZ6VB87DW05Z",
  "year": 2018,
  "files": [{
    "height": 4892,
    "name": "13-8032-5113",
    "width": 4892,
    "x": 19254793.17314903,
    "y": -4980025.266835816
  }]
}
```

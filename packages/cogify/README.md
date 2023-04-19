# @basemaps/cogify

CLI to retile imagery into a [Cloud Optimised Geotiffs](https://www.cogeo.org/) aligned to a [TileMatrix](https://www.ogc.org/standard/tms/)



## Usage


Install `cogify` using `npm`
```
npm install -g @basemaps/cogify
```


```
$ cogify --help

- cover - Create a covering configuration from a collection from source imagery
- create - Create a COG from a covering configuration
```


### Covering

Create a tile covering for WebMeractorQuad from source imagery located in s3 and outputs the resulting configuration files into `./output/:projection/:imageryName/:id/collection.json`

```
cogify cover --tile-matrix WebMercatorQuad s3://linz-imagery/new-zealand/north-island_2023_0.5m/rgb/2193/ --target ./output
```

### Create

Create the first COG from the list
```
cogify create ./output/3857/north-island_2023_0.5m/:id/collection.json --index 0
```


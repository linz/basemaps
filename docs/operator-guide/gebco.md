# Gebco re-project to NZTM2000Quad cog file

[GEBCO](https://www.gebco.net/) grid data are based on WGS84 which required to re-project into NZTM2000Quad tilematrix before importing into Basemaps. This instruction include the process of re-project [Gebco data](https://www.gebco.net/data_and_products/gridded_bathymetry_data/) into NZTM2000Quad tiff file by using gdal commands. Then we can process the output by [cogify](https://github.com/linz/basemaps/tree/master/packages/cogify) commands to import into LINZ Basemaps.

## Process

Download the lastest [Gebco gridded bathymetry data](https://www.gebco.net/data_and_products/gridded_bathymetry_data/).

Build VRT first with the Gdal command.

```bash
docker run \
    --rm -it -v $PWD:$PWD \
    --workdir $PWD ghcr.io/osgeo/gdal:ubuntu-small-3.8.3 \
    gdalbuildvrt \
    geotiff_output/gebco_2023.vrt \
    gebco_2023_geotiff/*.tif
```

Wrap VRT and re-project into 2193 projection

```bash
docker run
    --rm -it -v $PWD:$PWD
    --workdir $PWD ghcr.io/osgeo/gdal:ubuntu-small-3.8.3
    gdalwarp
    -of VRT
    -r bilinear 
    -ot float32
    -multi
    -s_srs EPSG:4326
    -t_srs EPSG:2193
    geotiff_out/gebco_2023.vrt
    geotiff_out/wrapped_gebco_2023.vrt

```

GDAL translate to process the source file into NZTM2000 (EPSG:2193) COG within the [NZTM2000Quad Extents](https://github.com/linz/NZTM2000TileMatrixSet/blob/master/raw/NZTM2000Quad.json#L7)

```bash
docker run
    --rm -it -v $PWD:$PWD
    --workdir $PWD ghcr.io/osgeo/gdal:ubuntu-small-3.8.3
    gdal_translate
    -of COG
    -co TARGET_SRS=EPSG:2193
    -co EXTENT=-3260586.7284,419435.9938,6758167.443,10438190.1652
    geotiff_out/wrapped_gebco_2023.vrt
    geotiff_out/gebco_2023.tiff

```

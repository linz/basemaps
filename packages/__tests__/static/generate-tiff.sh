#!/bin/bash

# NZTM2000 has a weird tiling scheme, this creates a tiff centered around
# tiles: 0.5, 1.5 -> 1.5, 2.5
gdal_translate -a_srs epsg:2193 \
    -a_ullr 146880 6559360 2440640 4265600 \
    -of GTiff -co COMPRESS=WEBP -co WEBP_LOSSLESS=TRUE \
    -co TILED=YES -co BLOCKXSIZE=16 -co BLOCKYSIZE=16 \
    rgba8_tiled.tiff rgba8.nztm2000.tiff



# Webmercator bounds are 20037508.3427892 x -20037508.3427892 square
# So create a tiff approx half the size
gdal_translate -a_srs epsg:2193 \
    -a_ullr -10018754.1713946 10018754.1713946 10018754.1713946 -10018754.1713946 \
    -of GTiff -co COMPRESS=WEBP -co WEBP_LOSSLESS=TRUE -co TILED=YES \
    -co TILED=YES -co BLOCKXSIZE=16 -co BLOCKYSIZE=16 \
    rgba8_tiled.tiff rgba8.google.tiff

#!/bin/bash

FILE_IN=$1
TILE_NUM=$2

file_name=$( basename $FILE_IN | sed 's/.tif//' )

function tiff_dims() {

    EXTENT=$(tiffinfo "$1" | grep 'Image Width:' | sed 's/Image Width://' | sed 's/Image Length://' )
    echo -n "$EXTENT"
}


ExtractedExtent=$(tiff_dims "${FILE_IN}")
#echo $ExtractedExtent

set -- $ExtractedExtent

pix_wide=$1
pix_high=$2

width_extract=$( bc <<< ''$pix_wide'/'$TILE_NUM'' )

height_extract=$( bc <<< ''$pix_high'/'$TILE_NUM'' )

echo "$pix_wide"
echo "$pix_high"
echo "$width_extract"
echo "$height_extract"

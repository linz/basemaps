#!/bin/bash
 
prof="--profile lake"
comp="-co compress=lzw -co predictor=2"
inpth=`dirname $1`
infn=`basename $1`
outpth="${inpth/linz-raster-data-store/basemaps-cog-copy}"
outfn="${infn/.tif/.copy.tif}"

aws s3 cp "$inpth/$infn" . $prof 
gdal_translate $comp -a_srs EPSG:2193 $infn $outfn
aws s3 cp $outfn "$outpth/$infn"
rm $infn $outfn

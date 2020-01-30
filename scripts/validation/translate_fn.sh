#!/bin/bash
  
prof="--profile lake"
comp="-co compress=lzw -co predictor=2"
srs="-a_srs EPSG:2193"
inpth=`dirname $1`
infn=`basename $1`
outpth="${inpth/linz-raster-data-store/basemaps-cog-copy}"
outfn="${infn/.tif/.copy.tif}"

aws s3 cp "$inpth/$infn" . $prof
err=`./validate.sh $infn`

if [ ! -z "$err"]; then
        gdal_translate $comp $srs $infn $outfn
        aws s3 cp $outfn "$outpth/$infn"
        rm $infn $outfn
else
        rm $infn
fi

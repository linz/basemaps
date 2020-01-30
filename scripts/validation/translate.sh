#!/bin/bash
  

pth="s3://linz-raster-data-store/aerial-imagery/"
#DS="canterbury_rural_2016-18_0.3m west-coast_rural_2016-17_0.3m bay-of-plenty_urban_2014-15_0.125m bay-of-plenty_rural_2015-17_0.25m "
#DSX=""
DS="tauranga_urban_2017_0.1m canterbury_rural_2016-18_0.3m west-coast_rural_2016-17_0.3m bay-of-plenty_urban_2014-15_0.125m bay-of-plenty_rural_2015-17_0.25m "
DSX="otago_rural_2017-19_0.3m hamilton_urban_2019_0.1m"

for ds in "$DS$DSX"; do
        ./translate_ds.sh "$pth$ds/"
done

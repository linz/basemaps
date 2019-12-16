#!/bin/bash

#Run script from within package directory.  Be sure XML file is stored in this directory.

#Download data here
#wget https://www.bodc.ac.uk/data/open_download/gebco/GEBCO_15SEC/zip/
#unzip GEBCO_2019.zip
#gdal_translate -of GTiff GEBCO_2019/GEBCO_2019.nc GEBCO_2019.tif
#gdalwarp -s_srs EPSG:4326 -t_srs EPSG:3857 GEBCO_2019.tif GEBCO_2019_webmer.tif

#The GEBCO dataset may be processed here in the above script or the processed GTiff (unzipped, converted to GTiff and, projected)
#is entered as the first argument of the BASH script


FILE_IN=$1

out_dir=/home/ireese/testing/gebco_clip_hs_work/out_dir
out_dir_geoprocessed=/home/ireese/testing/gebco_clip_hs_work/out_dir_geoprocessed
xml_template=/home/ireese/testing/gebco_clip_hs_work/process/tiler_XML_template.xml


#make multiple of 2 to the power of...
TILE_NUM=8


#projection of the base file in EPSG format
proj4=`./tiler_georef_getproj.sh $FILE_IN`
echo $proj4

epsg='EPSG:3857'

#create base name for file
file_name=$( basename $FILE_IN | sed 's/.tiff//' )
echo $file_name

#get pixel dimensions
pixels_out=`./tiler_georef_pixels_format.sh $FILE_IN $TILE_NUM`

echo $pixels_out

set -- $pixels_out
pix_wide=$1
pix_high=$2
width_extract=$3
height_extract=$4

echo "$pix_wide"
echo "$pix_high"
echo "$width_extract"
echo "$height_extract"

coords_out=`./tiler_georef_bbx_format.sh $FILE_IN`

echo $coords_out

set -- $coords_out
ulx_init=$1
uly=$2
lrx=$3
lry=$4

echo "$ulx"
echo "$uly"
echo "$lrx"
echo "$lry"

width=$( bc <<< 'scale=3; (-1*'$ulx_init')+'$lrx'' )
#echo $width
width_div=$( bc <<< 'scale=3; '$width'/'$TILE_NUM'' )
#echo "width divided by 6 = "$width_div

height=$( bc <<< 'scale=3; ('$uly')+(-1*'$lry')' )
#echo $height
height_div=$( bc <<< 'scale=3; '$height'/'$TILE_NUM'' )
#echo "height divided by 6 = "$height_div

ytop=0
#pix_y_top_edge=0
for j in $(eval echo "{1..$TILE_NUM}")
do
	
	#geo_coord work
	ulx=$ulx_init
	lry=$( bc <<< 'scale=3; '$uly'-('$height_div')' )

	echo "pixel top edge= "$ytop
	ybottom=$( bc <<< ''$ytop'+('$height_extract')' )
	#echo "pixel crop width= "$crop_height

	xtop=0
	for i in $(eval echo "{1..$TILE_NUM}")
	do
		echo $i

		#geo_coord work
		lrx=$( bc <<< 'scale=3; '$ulx'+('$width_div')' )
		extent=$(echo $ulx $uly $lrx $lry)
		#echo "Extent = "$extent
		ulx=$lrx

		#pixels work
		xbottom=$( bc <<< ''$xtop'+('$width_extract')' )
		echo "x top:"$xtop  "y top:"$ytop  "xbottom:"$xbottom  "ybottom:"$ybottom

		outtiff_tile=$out_dir/${file_name}_${i}${j}.tif
		outtiff_hs=$out_dir/${file_name}_${i}${j}_hs.tif

		gdal_translate -of GTiff -a_srs $epsg -r bilinear -projwin $extent $FILE_IN $outtiff_tile

		gdaldem hillshade -compute_edges -multidirectional $outtiff_tile $outtiff_hs

		#construct xml file for nik2img
		#add file name exports
		cat $xml_template | sed -e "s%FILENAME%${outtiff_tile}%g" | sed -e "s%HILLSHADE%${outtiff_hs}%g" | sed -e "s%PROJECTION_STRING%${proj4}%g" > $out_dir/${file_name}.xml

		#create single blended image
		png_file=$out_dir/${file_name}.png
		nik2img.py $out_dir/${file_name}.xml $png_file --no-open -f PNG -d $width_extract $height_extract
		
		#geolocate, reattach metadata
		outtiff_geo=${out_dir_geoprocessed}/${file_name}_${i}${j}.tif
		gdal_translate -of GTiff -r bilinear -a_ullr $extent -a_srs $epsg $png_file $outtiff_geo
		rm $png_file
		rm $out_dir/${file_name}.xml

		xtop=$xbottom
	done
	ytop=$ybottom
	uly=$lry

done

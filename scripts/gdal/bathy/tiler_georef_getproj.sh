#!/bin/bash

FILE_IN=$1

function gdal_get_proj() {

	PROJ4=$(gdalinfo -nomd $1 |\
	    grep "EXTENSION" |\
	    sed 's/EXTENSION//g' |\
	    sed 's/PROJ4//g' |\
	    tr -d "[],\"" |\
	    sed 's/    //')
	echo -n  $PROJ4
}

proj4=$( gdal_get_proj ${FILE_IN} )

echo $proj4

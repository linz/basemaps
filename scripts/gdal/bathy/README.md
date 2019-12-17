#### BASH scripts for producing GEBCO bathymetry

Script will take GEBCO input tiff:

1. Tile the file into smaller pieces
1. Create a hillshade for each smaller file
1. Style the elevation and hillshade via a Mapnik XML document
1. Create a styled png using nik2img
1. Georeference the png and export a styled geotiff


## run script 

bash tiler_georef_fullprocess.sh GEBCO.tiff

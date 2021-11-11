# Texture shading

> Texture shading is a new technique for generating shaded relief images to show the three-dimensional structure of mountainous terrain. It differs from traditional hillshading and can be used either as an alternative shading method, or as an enhancement to hillshading by combining the two methods. Texture shading emphasizes the drainage network (canyons and ridges) of the landscape and exhibits a visual hierarchy that reflects this structure. It can be used to bring out fine details that are present in high-quality elevation data, and likewise as a tool to examine digital elevation models for unwanted data artifacts.

See http://www.textureshading.com/Home.html


## Process

```bash
#!/bin/bash
#################
# Process DEM using texture_shade
#
# This process requires a huge amount of memory, for the 8M geographx DEM it requires around 100GB of free memory
# This process has been tested on a AWS R5D with 32VCPUs and 256GB of ram, starting with a base AWS centos image
# 
#################
# Install required software
sudo yum groupinstall 'Development Tools'
sudo yum install tmux git

# start docker
sudo systemctl start docker
sudo docker ps

# Helper function to run docker 
function gdal_docker() {
    sudo docker run --rm -it -v $PWD:$PWD --workdir $PWD osgeo/gdal:ubuntu-small-3.3.3 "$@"
}

# Ensure we have access to a GDAL > 3.3
gdal_docker gdal_translate --version

# Install texture_shade
git clone git@github.com:linz/texture-shade.git
cd texture-shade
make clean
make

# AWS R5d come with two NVME ssds they will be unmounted and unformatted to begin with
# Format the disks into ext4 and mount them into the home directory
# Prepare disk drives
sudo fdisk -l
sudo mkfs.ext4 /dev/nvme1n1
sudo mkfs.ext4 /dev/nvme2n1

# Mount NVME drives
mkdir n1 n2
sudo mount /dev/nvme1n1 n1
sudo mount /dev/nvme2n1 n2
# Allow our user to write to the folders
sudo chown ssm-user:ssm-user n* -R


cd n1

# Grab required files
aws s3 cp s3://linz-basemaps-source/Geographx-NZ-DEM Geographx-NZ-DEM --recursive

# Craete a VRT
gdal_docker gdalbuildvrt Geographx-NZ-DEM-FLT.vrt Geographx-NZ-DEM/*.tif

# texture requires a FLT file
gdal_docker gdal_translate -of EHdr -ot Float32 Geographx-NZ-DEM-FLT.vrt Geographx-NZ-DEM-FLT.flt

# validate flt was created ok
gdal_docker gdalinfo Geographx-NZ-DEM-FLT.flt

sudo chown ssm-user:ssm-user n1 -R

# Texture shading takes a while run inside of tmux so the session can be resumed with `tmux attach`
tmux 
../texture-shade/bin/texture 1 Geographx-NZ-DEM-FLT.flt Geographx-NZ-DEM-FLT.detail_1.flt
../texture-shade/bin/texture_image +1.5 Geographx-NZ-DEM-FLT.detail_1.flt Geographx-NZ-DEM-FLT.detail_1.contrast_1.5.tif # texture-shade only allows ".tif"

# Compress the output tiff
gdal_docker gdal_translate -of Gtiff -co COMPRESS=lzw -co BIGTIFF=yes -co NUM_THREADS=ALL_CPUS -co TILED=yes \
     Geographx-NZ-DEM-FLT.detail_1.contrast_1.5.tif Geographx-NZ-DEM-FLT.detail_1.contrast_1.5.lzw.tiff


# Store the result back in s3

aws s3 cp Geographx-NZ-DEM-FLT.detail_1.contrast_1.5.lzw.tiff s3://linz-basemaps-source/Geographx-NZ-DEM-FLT/
```
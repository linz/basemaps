FROM osgeo/gdal:ubuntu-small-latest

#ARG dataset=auckland_urban_2017_0-075m
ARG dataset=wellington_urban_2017_0.10m
ARG minzoom=20
ARG maxcogs=80
#ARG ulid=01E1X6V4BW4GNT86Q8J200G0FB #AKL
ARG ulid=01DZMDXXEA1DEQDRY2F56PQ8EE
#ARG quadkey=311333000221 #AKL
#ARG quadkey=3131110000333 
# add to job.json
ARG quadkey=313111000300302312

COPY output output
RUN ls output/4326/

RUN apt-get update && \
    apt-get install -qq -y build-essential npm git vim

RUN npm -g install typescript yarn n && \
    n stable 

RUN git clone https://github.com/linz/basemaps.git && \
    cd basemaps &&\
    git checkout cog-wrap-resample-test && \
    yarn && \
    yarn build

#RUN ./basemaps/packages/cog/cogify -V job --source s3://linz-raster-data-store/aerial-imagery/$dataset --source-role-arn arn:aws:iam::167241006131:role/basemaps-s3-access-raster-data-store@data-stores.system --source-role-external-id basemaps-ihohmu7O --output output/ --geojson --min-zoom $minzoom  --max-cogs $maxcogs --vrt
#RUN ./basemaps/packages/cog/cogify -V resample --job output/4326/$dataset/$ulid/job.json --quadkey $quadkey --resample bilinear --commit
#ec2. docker cp <container-id>:output/4326/<dataset>/<ulid>/<quadkey>.tiff example.tiff
#locally. scp ubuntu@<ec2>:~/basemaps/test/example.tiff .   
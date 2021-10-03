FROM osgeo/gdal:ubuntu-small-3.3.0

WORKDIR /usr/src/app

RUN apt-get update
RUN apt-get install -y openssl ca-certificates > /dev/null 2>&1
RUN update-ca-certificates
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

COPY dist/* ./

ENTRYPOINT [ "node", "./index.js" ]

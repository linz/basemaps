FROM osgeo/gdal:ubuntu-small-3.3.0

WORKDIR /usr/src/app

RUN apt-get update
RUN apt-get install -y openssl ca-certificates > /dev/null 2>&1
RUN update-ca-certificates
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

# Install sharp TODO update this when we change sharp versions
RUN npm install sharp@0.30.7

COPY dist/index.cjs ./

ENTRYPOINT [ "node", "./index.cjs" ]

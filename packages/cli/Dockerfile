FROM ghcr.io/osgeo/gdal:ubuntu-small-3.7.0

ENV NODE_ENV=PRODUCTION

WORKDIR /app/

# RUN apt-get update
# RUN apt-get install -y openssl ca-certificates > /dev/null 2>&1
# RUN update-ca-certificates
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs git

# Install sharp TODO update this when we change sharp versions
RUN npm install sharp@0.30.7

# Install the landing assets
COPY ./basemaps-landing*.tgz /app/
COPY ./basemaps-cogify*.tgz /app/
COPY ./.prettierrc.js /app/node_modules/@linzjs/.prettierrc.js

RUN npm install ./basemaps-landing*.tgz ./basemaps-cogify*.tgz

COPY dist/index.cjs /app/

ENTRYPOINT [ "node", "./index.cjs" ]
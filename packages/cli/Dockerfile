# Building container for tippecanoe
FROM node:24-slim as builder

RUN apt-get update \
  && apt-get -y upgrade \
  && apt-get -y install build-essential libsqlite3-dev zlib1g-dev git

RUN mkdir -p /tmp/
RUN git clone https://github.com/mapbox/tippecanoe.git /tmp/tippecanoe
RUN cd /tmp/tippecanoe/ && make -j$(nproc)

# Building basemaps cli container
FROM ghcr.io/osgeo/gdal:ubuntu-small-3.8.0

ENV NODE_ENV=PRODUCTION

WORKDIR /app/

RUN apt-get update
RUN apt-get install -y ca-certificates curl gnupg
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
ENV NODE_MAJOR=24
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update
RUN apt-get install -y nodejs apt-utils build-essential

# Install sharp TODO update this when we change sharp versions
RUN npm install sharp@0.33.0

# Install the landing assets
COPY ./basemaps-smoke*.tgz /app/

# Copy the static files for v1/health check
COPY ./static/ /app/static/
# Copy the Vector Schema into the image
COPY ./schema/ /app/schema/
# Copy the Vector Analysis into the image
COPY ./analysis/ /app/analysis/

RUN npm install  ./basemaps-smoke*.tgz

COPY dist/index.cjs /app/

# Add tippecanoe into the image
COPY --from=builder /tmp/tippecanoe/tippecanoe /usr/bin/tippecanoe
COPY --from=builder /tmp/tippecanoe/tile-join /usr/bin/tile-join

ENTRYPOINT [ "node", "./index.cjs" ]
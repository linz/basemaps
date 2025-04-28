FROM node:20-slim as builder

RUN apt-get update \
  && apt-get -y upgrade \
  && apt-get -y install build-essential libsqlite3-dev zlib1g-dev git

RUN mkdir -p /tmp/
RUN git clone https://github.com/mapbox/tippecanoe.git /tmp/tippecanoe
RUN cd /tmp/tippecanoe/ && make -j$(nproc)

FROM osgeo/gdal:ubuntu-small-3.6.1

ENV BASEMAPS_HOST=https://basemaps.linz.govt.nz

ARG GIT_VERSION
ENV GIT_VERSION ${GIT_VERSION}

ARG GIT_HASH=unknown
ENV GIT_HASH ${GIT_HASH}

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs apt-utils build-essential

WORKDIR /app

ADD package.json package-lock.json /app/
RUN npm install --omit=dev

ADD build/src /app/
COPY --from=builder /tmp/tippecanoe/tippecanoe /usr/bin/tippecanoe
COPY --from=builder /tmp/tippecanoe/tile-join /usr/bin/tile-join

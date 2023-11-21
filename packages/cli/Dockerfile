FROM ghcr.io/osgeo/gdal:ubuntu-small-3.8.0

ENV NODE_ENV=PRODUCTION

WORKDIR /app/

RUN apt-get update
RUN apt-get install -y ca-certificates curl gnupg
RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
ENV NODE_MAJOR=18
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update
RUN apt-get install -y nodejs

# Install sharp TODO update this when we change sharp versions
RUN npm install sharp@0.32.6

# Install the landing assets
COPY ./basemaps-landing*.tgz /app/
COPY ./basemaps-cogify*.tgz /app/

RUN npm install ./basemaps-landing*.tgz ./basemaps-cogify*.tgz

COPY dist/index.cjs /app/

ENTRYPOINT [ "node", "./index.cjs" ]
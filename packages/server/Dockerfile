FROM node:18-slim@sha256:d2d8a6420c9fc6b7b403732d3a3c5395d016ebc4996f057aad1aded74202a476

# Node does not like running as PID 1, use dumb-init to handle the init
#
# https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init


ENV NODE_ENV=PRODUCTION

WORKDIR /app/basemaps
COPY ./basemaps-landing*.tgz /app/basemaps/
COPY ./basemaps-server*.tgz /app/basemaps/

RUN npm install ./basemaps-landing*.tgz
RUN npm install ./basemaps-server*.tgz

# Switch to a non root user
USER node

ENTRYPOINT ["/usr/bin/dumb-init", "--", "node", "/app/basemaps/node_modules/.bin/basemaps-server"]
EXPOSE 5000

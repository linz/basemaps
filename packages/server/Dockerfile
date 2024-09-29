FROM node:20-slim@sha256:363a50faa3a561618775c1bab18dae9b4d0910a28f249bf8b72c0251c83791ff

# Node does not like running as PID 1, use dumb-init to handle the init
#
# https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init


ENV NODE_ENV=PRODUCTION

WORKDIR /app/basemaps
COPY ./basemaps-landing*.tgz /app/basemaps/
COPY ./basemaps-server*.tgz /app/basemaps/

# Copy the static files for v1/health check
COPY ./static/ /app/static/

RUN npm install ./basemaps-landing*.tgz
RUN npm install ./basemaps-server*.tgz

# Switch to a non root user
USER node

ENTRYPOINT ["/usr/bin/dumb-init", "--", "node", "/app/basemaps/node_modules/.bin/basemaps-server"]
EXPOSE 5000

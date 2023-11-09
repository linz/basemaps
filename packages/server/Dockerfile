FROM node:18-alpine

ENV NODE_ENV=PRODUCTION

WORKDIR /app/basemaps
COPY ./basemaps-landing*.tgz /app/basemaps/
COPY ./basemaps-server*.tgz /app/basemaps/

RUN npm install ./basemaps-landing*.tgz
RUN npm install ./basemaps-server*.tgz

# Use /bin/sh to allow ctrl+c to be properly handled to node whenn run in `docker run -it` mode
ENTRYPOINT ["/bin/sh", "-c", "node /app/basemaps/node_modules/.bin/basemaps-server"]
EXPOSE 5000
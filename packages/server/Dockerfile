FROM node:18-alpine

ENV NODE_ENV=PRODUCTION

WORKDIR /app/basemaps
COPY ./basemaps-landing*.tgz /app/basemaps/
COPY ./basemaps-server*.tgz /app/basemaps/

RUN npm install ./basemaps-landing*.tgz
RUN npm install ./basemaps-server*.tgz

ENTRYPOINT ["node", "/app/basemaps/node_modules/.bin/basemaps-server"]
EXPOSE 5000
FROM node:18-alpine

ENV NODE_ENV PRODUCTION

WORKDIR /basemaps
COPY ./*.tgz /basemaps/

RUN npm install ./basemaps-landing*.tgz
RUN npm install ./basemaps-server*.tgz

ENTRYPOINT ["node", "/basemaps/node_modules/.bin/basemaps-server"]
EXPOSE 5000
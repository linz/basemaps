FROM node:18-alpine

ENV NODE_ENV PRODUCTION

COPY ./*.tgz /app

RUN npm install ./basemaps-landing*.tgz
RUN npm install ./basemaps-server*.tgz

CMD node /app/node_modules/.bin/basemaps-server.cjs
EXPOSE 5000
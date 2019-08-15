FROM node:12

WORKDIR /app

COPY *.json *.js yarn.lock ./ 
COPY packages ./packages

RUN yarn  
RUN yarn run build
RUN yarn run lint
RUN yarn run test
RUN yarn audit
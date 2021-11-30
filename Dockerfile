FROM node:14

WORKDIR /app

COPY *.json *.cjs yarn.lock .gitignore ./
COPY packages ./packages

RUN yarn install --frozen-lockfile
RUN yarn run build


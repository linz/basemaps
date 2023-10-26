# @basemaps/cli

This package contains cli's that are mainly used by the configuration and CICD processes in the LINZ Basemaps. All of the cli commands in this package will be build into docker container and publish as a [github container](https://github.com/linz/basemaps/pkgs/container/basemaps%2Fcli)

## Install

This script requires docker to be installed

To install

```bash
npm i @basemaps/cli
```

## Usage -- Bundle

Bundle config files into config bundle json from a given config path. This is mainly use for [linz/basemaps-config](https://github.com/linz/basemaps-config) CICD process to bundle all the individual config json files into a single JSON bundle.

```bash
./bin/bmc.js bundle --config config/ --assets assets/asset.tar --output config.json
```

## Usage -- Import

Import all configs from a bundled config.json into dynamo db from a given config path. This is mainly use for [linz/basemaps-config](https://github.com/linz/basemaps-config) repository ci/cd process to deploy the config changes into DynamoDB.

```bash
./bin/bmc.js import --config config.json --commit
```

## Usage -- Screenshots

Dump the screenshots from basemaps production, this mainly using for the screenshot validation smoke tests in the basemaps ci/cd process.

```bash
./bin/bmc.js screenshot
```

Dump the screenshots from different host

```bash
./bin/bmc.js screenshot --host HOST

```

Dump the screenshots with config file

```bash
./bin/bmc.js screenshot --config s3://..../config.json.gz

```

## Usage -- Create Config

Create a individual config.json from a path of imagery for Basemaps to load as standalone server to view them. This is mainly used for the preview images for the Basemaps imagery import process.

```bash
./bin/bmc.js create-config --path s3://..../images/*.tiff --title image_title --commit
```

## Usage -- Overview

Create a overview tar file of tiles from the given of imagery. This create low zoom level tiles for the individual imagery and significantly improve the performance of serving individual imagery by pre-rendering and saving the tiles instead of rendering them on the fly.

```bash
./bin/bmc.js create-overview --config s3://..../images/*.tiff --output overview/overviews.tar.co
```

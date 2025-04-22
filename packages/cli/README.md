# @basemaps/cli

This package contains cli's that are mainly used by the configuration and CICD processes in the LINZ Basemaps. All of the cli commands in this package will be build into docker container and publish as a [github container](https://github.com/linz/basemaps/pkgs/container/basemaps%2Fcli)

## Install

This script requires docker to be installed

To install

```bash
npm i @basemaps/cli
```

## Usage -- Config

Config clis in @basemap/cli-config 

```bash
./bin/bmc.js config --help
```
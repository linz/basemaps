# @basemaps/server

WMTS/XYZ Tile server command line interface.

This wraps the [@basemaps/lambda-tiler](https://github.com/linz/basemaps/blob/master/packages/lambda-tiler/README.md) into a standalone http server using [fastify](https://www.fastify.io/).

## Usage
Basemaps server expects a folder tree full of configuration, with multiple tilesets and styles configuration files.

```bash
basemaps-server --config path/to/config/
```

### Usage docker

The server is also published as a docker container 

```bash
docker run -it \
    --volume $PWD/config:/config \
    --volume $PWD/tiffs:$PWD/tiffs \
    -p 5000:5000 \
     ghcr.io/linz/basemaps-server:v6 --config /config
```

Where `${PWD}/config` contains all the configuration and `${PWD}/tiffs` is all the relevant tiff files

### Bundled configuration

Basemaps server can also be configured with a single JSON configuration bundle file using [@basemaps/cli](https://github.com/linz/basemaps/blob/master/packages/cli/README.md)

By bundling the configuration the startup time is greatly reduced as each individual tiff file does not have to be scanned for dimensions, it does mean that new tiffs will not be picked up until a new bundle is created.

```bash
bmc bundle --config config/ --output config.bundle.json
basemaps-server --config config.bundle.json
```


### Usage with LINZ imagery
Usage with basemaps config, you will need access to basemaps' imagery cache 

please contact basemaps@linz.govt.nz if you need access.

```bash
git clone github.com/linz/basemaps-config

bmc bundle --config basemaps-config/config --output config.bundle.json
basemaps-server --config config.bundle.json
```


### Direct TIFF access

If you have a folder of tiffs the `@basemaps/server` can index the folder and create tiles from it


For example given a structure where there are two folders full of tiffs

```
/images/00_gebco_2021_305-75m/*.tiff
/images/10_geographx_nz_texture_shade_2012_8-0m/*.tiff
```

running `basemaps-server /images/00_gebco_2021_305-75m/ /images/10_geographx_nz_texture_shade_2012_8-0m/` will create two tile sets one for each folder `gebco_2021...` and `geographx_nz_t...` and then also create a combined layer in the order the tiffs are found.


## Developing

When running the `@basemaps/server` in development mode, ensure `@basemaps/landing` page has been built and bundled

```bash
yarn
yarn build

npx lerna run bundle --stream # Bundle everything
```

This will package all the static assets into `landing/dist` and will be served from `http://localhost:5000`

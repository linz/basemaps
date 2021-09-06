# @basemaps/server

WMTS/XYZ Tile server command line interface.

This wraps the @basemaps/lambda-tiler into a standalone express http server.

## Usage

```
./basemaps-server path/to/config
```

Usage with basemaps config, you will need access to basemaps' imagery cache 

please contact basemaps@linz.govt.nz if you need access.
```
git clone github.com/linz/basemaps-config

./basemaps-server basemaps-config/config
```
# Basemaps Config CLI

This package is to control the configuration in the LINZ basemaps product.

## Usage -- Screenshots

Dump the screenshots from basemaps production

```bash
./bin/bmc.js screenshot
```

Dump the screenshots from different host and tag

```bash
./bin/bmc.js screenshot --host HOST --tag PR-TAG

```

## Usage -- Screenshots-server

Create a temporary server from a config bundle file and dump the screenshots

```bash
./bin/bmc.js screenshot-server - config s3://..../config.json.gz
```

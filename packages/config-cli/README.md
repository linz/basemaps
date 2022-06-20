# Basemaps Config CLI

This package is to control the configuration in the LINZ basemaps product.

## Usage -- Screenshots

Dump the screenshots from basemaps production

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

## Usage -- Bundle

Bundle config files into config bundle json from a given config path.

```bash
./bin/bmc.js bundle --config config/ --output config.json
```

## Usage -- Import

Import all configs from a bundled config.json into dynamo db from a given config path

```bash
./bin/bmc.js import --config config.json --commit
```

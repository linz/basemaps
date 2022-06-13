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
./bin/bmc.js screenshot -- config s3://..../config.json.gz

```

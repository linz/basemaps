# @basemaps/landing

The landing page for basemaps https://basemaps.linz.govt.nz


## Development

To start a local test server there are two options

### Create a full basemaps server

Using [@basemaps/server](../server/README.md) a entire local test environment can be run. to ensure the latest assets are served by the local server `yarn bundle` should be run first

this is best when testing larger basemaps changes across multiple packages, but needs access to some imagery.

### Simple local server

The simple local server is used to validate html/css/js changes in the landing page this does not run a basemaps tile server and will default to `https://dev.basemaps.linz.govt.nz`

```bash
yarn bundle
node serve.mjs
```


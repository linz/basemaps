# Basemaps

[![Build Status](https://github.com/linz/basemaps/workflows/Build/badge.svg)](https://github.com/linz/basemaps/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/linz/basemaps/blob/master/LICENSE)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/linz/basemaps.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/linz/basemaps/context:javascript)

A digital basemap provides a consistent background detail necessary to orient location and add to aesthetic appeal. Basemaps can be made up of streets, parcels, boundaries (country, regional, and city boundaries), shaded relief of a digital elevation model, waterways, hydrography, aerial and satellite imagery. Basemaps can be used as desktop, website or mobile phone application components, or as a 3rd party layers within a GIS or desktop mapping application.

## Building

This repository requires [NodeJs](https://nodejs.org/en/) > 12 & [Yarn](https://yarnpkg.com/en/)

Use [n](https://github.com/tj/n) to manage nodeJs versions

```bash
# Download the latest nodejs & yarn
n latest
npm install -g yarn

# Install node deps
yarn

# Build everything into /build
yarn run build

# Run the unit tests
yarn run test
```

## License

This system is licensed under the MIT License, except where otherwise specified. See the [LICENSE](https://github.com/linz/basemaps/blob/master/LICENSE) file for more details.

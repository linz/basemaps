# Basemaps

[![Build Status](https://github.com/linz/basemaps/workflows/Build/badge.svg)](https://github.com/linz/basemaps/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/linz/basemaps/blob/master/LICENSE)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/linz/basemaps.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/linz/basemaps/context:javascript)

A digital basemap provides a consistent background detail necessary to orient location and add to aesthetic appeal. Basemaps can be made up of streets, parcels, boundaries (country, regional, and city boundaries), shaded relief of a digital elevation model, waterways, hydrography, aerial and satellite imagery. Basemaps can be used as desktop, website or mobile phone application components, or as a 3rd party layers within a GIS or desktop mapping application.

## Packages:

- [@basemaps/test](packages/__tests__/) - Testing utilities and assets
- [@basemaps/infra](packages/_infra/) - Infrastructure code using [AWS CDK](https://github.com/aws/aws-cdk)
- [@basemaps/attribution](packages/attribution/) - Calculate the attribution for given map location
- [@basemaps/bathymetry](packages/bathymetry/) - Convert bathymetry from [GEBCO](https://www.gebco.net/) into colorized HillShade geotiff.
- [@basemaps/cli](packages/cli/) - cli that using for CICD process
- [@basemaps/cogify](packages/cogify/) - CLI to re-tile imagery into a Cloud Optimised Geotiffs (COG)
- [@basemaps/config](packages/config/) - Configurations for Basemaps system
- [@basemaps/geo](packages/geo/) - Utility to work with QuadKeys, Tiles and Projections.
- [@basemaps/lambda-analytics](packages/lambda-analytics/) - Generate analytics from CloudFront distribution statistics
- [@basemaps/lambda-tiler](packages/lambda-tiler/) - Lambda server for WMTS/XYZ map generation
- [@basemaps/landing](packages/landing/) - The landing page for Basemaps
- [@basemaps/server](packages/server/) - cli for WMTS/XYZ Tile server
- [@basemaps/shared](packages/shared/) - Shared Utilities for other Basemaps packages
- [@basemaps/smoke](packages/smoke/) - Smoke tests
- [@basemaps/sprites](packages/sprites/) - sprite sheet generation
- [@basemaps/tiler](packages/tiler/) - Compose CogGeoTiffs for xyz tile server
- [@basemaps/tiler-sharp](packages/tiler-sharp/) - Generate tiles by using [sharp](https://github.com/lovell/sharp) and [libvips](https://github.com/libvips/libvips)
- [@linzjs/docker-command](packages/linzjs-docker-command/) - Utilities for running Docker Commands
- [@linzjs/geojson](packages/linzjs-geojson/) - Utility for working with GeoJSO
- [@linzjs/metrics](packages/linzjs-metrics/) - Simple timing metric tracker for NodeJS

## Building

This repository requires [NodeJs](https://nodejs.org/en/) > 16 & [Yarn](https://yarnpkg.com/en/)

Use [n](https://github.com/tj/n) or [fnm](https://github.com/Schniz/fnm) to manage nodeJs versions

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

## Example clients

See https://basemaps.linz.govt.nz/examples

## License

This system is licensed under the MIT License, except where otherwise specified. See the [LICENSE](https://github.com/linz/basemaps/blob/master/LICENSE) file for more details.

## Deployment

Deployments of Basemaps are managed with github actions.

To trigger a deployment, make sure your branch is up to date and run the version bump script [./scripts/version.bump.sh](./scripts/version.bump.sh)
This script will create a `release:` commit and branch, please review the commit then create a pull request from it.

Once the release pull request is merged the CI system will deploy the released version into dev then into production.

## Deployment Rollback

when a Deployment Breaks Badly, don't try to fix that on the fly, this risk of introducing more errors and downtime. The fastest way is to rollback to previous release immediately and fix the problem before next release.

As Basemaps deployments are managed with github actions, every release will bundle the release packages and deployment in the github action automatically. So, it is very simple for use to roll back to previous release as all the previous deployment are remained in the github actions history. Please use the following steps to trigger a deployment roll when needed.

- On the main page of the repository, above the file list, click :clock4: commits
- To navigate to the previous release commit, click the tick mark to see all the previous github actions for this commit.
- Select `Build / deploy-prod (push)` workflow and rerun the it to roll back to previous release.

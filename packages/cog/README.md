# @basemaps/cog

Create a collection of cloud optimized geotiff's from a collection of geotiff, that is optimized to be used in `@basemaps/tiler`

## Install

This script requires docker to be installed

To install cogify

```bash
npm i @basemaps/cog
```

## Usage

Create a list of COG's to create

```bash
cogify -V job --source ./source_folder/ --output ./source_folder/cogify/
```

Build a specific COG

```bash
cogify -V create-cog --job ./cogs/01DYREBEEFFXEPBAYBED2TMAFJ/job.json --quadkey 0
```

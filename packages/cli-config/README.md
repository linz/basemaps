# @basemaps/cli-config

CLI for Basemap config

## Usage -- Bundle

Bundle config files into config bundle json from a given config path. This is mainly use for [linz/basemaps-config](https://github.com/linz/basemaps-config) CICD process to bundle all the individual config json files into a single JSON bundle.

```bash
./build/bin.js bundle --config config/ --assets assets/asset.tar --output config.json
```

## Usage -- Bundle Assets

Create cotar file for the config assets. Creates a cotar file from a directory. This is mainly use for [linz/basemaps-config](https://github.com/linz/basemaps-config) CICD process to create cotar file.

```bash
./build/bin.js bundle-assets --assets assets/ --output output/
```

## Usage -- Import

Import all configs from a bundled config.json into dynamo db from a given config path. This is mainly use for [linz/basemaps-config](https://github.com/linz/basemaps-config) repository ci/cd process to deploy the config changes into DynamoDB.

```bash
./build/bin.js import --config config.json --commit
```

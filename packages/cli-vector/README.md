# @basemaps/cli-vector

CLI to create vector mbtiles for topographic map.

## Usage -- Bundle

Extract and load schema.json config files then prepare tasks for the next step to create mbtiles

```bash
node build/bin.js extract --path schema/ --cache s3://linz-basemaps-staging/vector/cache/
```

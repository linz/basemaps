# Bathymetry creation

This process takes DEM data from  converts it into a terrarium cogs

## Usage

You will need:

- DEM tiffs
- Docker (or a new gdal 3+ with netcdf support)
- Node >= v12

```bash
# Install dependencies
yarn add @basemaps/terrarium

# Create a the data file
basemaps-terrarium create --input inputPath --output outputPath --docker --tile-matrix-set NZTM2000Quad
```

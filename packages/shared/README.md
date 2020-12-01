# @basemaps/shared

This contains all code that is shared between multiple services, such as AWS connection logic and constant values

### Alternative Tilers and TileMatrixSets

Alternative tilers can be added to basemaps. These can then be accessed from the server by appending the tiler name to the EPSG projection; for example `https://dev.basemaps.linz.govt.nz/v1/tiles/aerial/EPSG:2193:agol/WMTSCapabilities.xml?api={ApiKey}` where `agol` is the alternative tiler.

To add an alternative tiler a couple of files need to be added/altered (using `agol` as the example):

1. add `src/trail.tms/nztm2000.agol.ts` as the definition of the Tile matrix set.
2. edit `src/proj/projection.tile.matrix.set.ts` and add `Nztm2000AgolTms` to `AlternativeTmsList`

This will make the alternative definition available in `@basemaps/lambda-tiler`

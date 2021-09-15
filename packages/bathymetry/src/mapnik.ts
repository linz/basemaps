import * as fs from 'fs';
import { BathyMaker } from './bathy.maker.js';
import { Tile, TileMatrixSet } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { FileType } from './file.js';

/** To prevent the long compile time of mapnik for development, only pull it in when needed */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mapnik = require('mapnik');
mapnik.register_default_input_plugins();

/** Create the mapnik template */
function makeTemplate(sourceFile: string, hillShade: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE Map[]>
<Map background-color="#2a383e" srs="+init=epsg:4326">

  <Style comp-op="color-dodge" filter-mode="first" name="gebco2019webmercator2">
    <Rule>
      <RasterSymbolizer default-color="rgba(0, 0, 0, 0)" default-mode="linear" scaling="bilinear">
        <stop color="#222222" value="0" />
        <stop color="#ebebeb" value="255" />
      </RasterSymbolizer>
    </Rule>
  </Style>
  <Layer name="gebco2019webmercator2" srs="+init=epsg:4326">
    <StyleName><![CDATA[gebco2019webmercator2]]></StyleName>
    <Datasource>
      <Parameter name="file"><![CDATA[${hillShade}]]></Parameter>
      <Parameter name="band"><![CDATA[1]]></Parameter>
      <Parameter name="type"><![CDATA[gdal]]></Parameter>
    </Datasource>
  </Layer>
  <Style comp-op="color-dodge" filter-mode="first" name="gebco2019webmercator-deuce">
    <Rule>
      <RasterSymbolizer default-color="rgba(0, 0, 0, 0)" default-mode="linear" opacity="0.75" scaling="bilinear">
        <stop color="rgba(0, 0, 0, 0)" value="-350" />
        <stop color="#88b3ac" value="0" />
        <stop color="#e7f0ef" value="200" />
      </RasterSymbolizer>
    </Rule>
  </Style>
  <Style comp-op="multiply" filter-mode="first" name="gebco2019webmercator">
    <Rule>
      <RasterSymbolizer default-color="rgba(0, 0, 0, 0)" default-mode="linear" scaling="bilinear">
        <stop color="#000000" value="-10881" />
        <stop color="#ffffff" value="100" />
        <stop color="rgba(0, 0, 0, 0)" value="101" />
      </RasterSymbolizer>
    </Rule>
  </Style>
  <Layer name="gebco2019webmercator" srs="+init=epsg:4326">
    <StyleName><![CDATA[gebco2019webmercator]]></StyleName>
    <StyleName><![CDATA[gebco2019webmercator-deuce]]></StyleName>
    <Datasource>
      <Parameter name="file"><![CDATA[${sourceFile}]]></Parameter>
      <Parameter name="band"><![CDATA[1]]></Parameter>
      <Parameter name="type"><![CDATA[gdal]]></Parameter>
    </Datasource>
  </Layer>
</Map>`;
}

/** composite a hillshade and base tile into a hillshaded file with mapnik */
async function render(bm: BathyMaker, tile: Tile, logger: LogType): Promise<string> {
    const tileId = TileMatrixSet.tileToName(tile);
    const warpedPath = bm.tmpFolder.name(FileType.Warped, tileId);
    const hillShadePath = bm.tmpFolder.name(FileType.HillShade, tileId);
    const outputPath = bm.tmpFolder.name(FileType.Rendered, tileId);
    if (fs.existsSync(outputPath)) return outputPath;

    const template = makeTemplate(warpedPath, hillShadePath);
    const map = new mapnik.Map(bm.config.tileSize, bm.config.tileSize);

    await new Promise<void>((resolve, reject) =>
        map.fromString(template, (err: Error) => (err == null ? resolve() : reject(err))),
    );

    map.zoomAll();

    const startTime = Date.now();
    await new Promise<void>((resolve, reject) =>
        map.renderFile(outputPath, (err: Error) => (err == null ? resolve() : reject(err))),
    );
    logger.debug({ duration: Date.now() - startTime }, 'MapnikRender');
    return outputPath;
}

export const MapnikRender = { render };

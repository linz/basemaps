import * as fs from 'fs';
import { BathyMaker } from './bathy.maker.js';
import { Tile, TileMatrixSet } from '@basemaps/geo';
import { LogType } from '@basemaps/shared';
import { FileType } from './file.js';

/** To prevent the long compile time of mapnik for development, only pull it in when needed */
import mapnik from 'mapnik';
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
  <Style comp-op="multiply" filter-mode="first" name="gebco2019webmercator">
    <Rule>
      <RasterSymbolizer default-color="rgba(0, 0, 0, 0)" default-mode="linear" scaling="bilinear">
        <stop color="#040418" value="-10881" />
        <stop color="#041c39" value="-8000" />
        <stop color="#062246" value="-5000" />
        <stop color="#073266" value="-2000" />
        <stop color="#095e7a" value="-100" />
        <stop color="#063646" value="20" />
        <stop color="#040418" value="100" />
        <stop color="#404040" value="2000" />
        <stop color="#919191" value="7150" />
      </RasterSymbolizer>
    </Rule>
  </Style>
  <Layer name="gebco2019webmercator" srs="+init=epsg:4326">
    <StyleName><![CDATA[gebco2019webmercator]]></StyleName>
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
  const map = new mapnik.Map(bm.config.tileSize, bm.config.tileSize) as any;

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

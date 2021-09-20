import o from 'ospec';
import { VNodeParser } from '../vdom.parse.js';

const VrtExample = `
<VRTDataset rasterXSize="36000" rasterYSize="3600">
  <SRS dataAxisToSRSAxisMapping="2,1">PROJCS["NZGD2000 / New Zealand Transverse Mercator 2000",GEOGCS["NZGD2000",DATUM["New_Zealand_Geodetic_Datum_2000",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6167"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4167"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",173],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",1600000],PARAMETER["false_northing",10000000],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Northing",NORTH],AXIS["Easting",EAST],AUTHORITY["EPSG","2193"]]</SRS>
  <GeoTransform>  1.1080000000000000e+06,  1.0000000000000000e+01,  0.0000000000000000e+00,  5.0100000000000000e+06,  0.0000000000000000e+00, -1.0000000000000000e+01</GeoTransform>
  <VRTRasterBand dataType="Byte" band="1">
    <ColorInterp>Red</ColorInterp>
    <SimpleSource>
      <SourceFilename relativeToVRT="1">small/2018-09-01_2019-04-30_CC05.tif</SourceFilename>
      <SourceBand>1</SourceBand>
      <SourceProperties RasterXSize="2400" RasterYSize="3600" DataType="Byte" BlockXSize="2400" BlockYSize="1" />
      <SrcRect xOff="0" yOff="0" xSize="2400" ySize="3600" />
      <DstRect xOff="0" yOff="0" xSize="2400" ySize="3600" />
    </SimpleSource>
    <SimpleSource>
      <SourceFilename relativeToVRT="1">small/2018-09-01_2019-04-30_CC06.tif</SourceFilename>
      <SourceBand>1</SourceBand>
      <SourceProperties RasterXSize="2400" RasterYSize="3600" DataType="Byte" BlockXSize="2400" BlockYSize="1" />
      <SrcRect xOff="0" yOff="0" xSize="2400" ySize="3600" />
      <DstRect xOff="2400" yOff="0" xSize="2400" ySize="3600" />
    </SimpleSource>
  </VRTRasterBand>
  <VRTRasterBand dataType="Byte" band="2">
    <ColorInterp>Green</ColorInterp>
    <SimpleSource>
      <SourceFilename relativeToVRT="1">small/2018-09-01_2019-04-30_CC05.tif</SourceFilename>
      <SourceBand>2</SourceBand>
      <SourceProperties RasterXSize="2400" RasterYSize="3600" DataType="Byte" BlockXSize="2400" BlockYSize="1" />
      <SrcRect xOff="0" yOff="0" xSize="2400" ySize="3600" />
      <DstRect xOff="0" yOff="0" xSize="2400" ySize="3600" />
    </SimpleSource>
    <SimpleSource>
      <SourceFilename relativeToVRT="1">small/2018-09-01_2019-04-30_CC06.tif</SourceFilename>
      <SourceBand>2</SourceBand>
      <SourceProperties RasterXSize="2400" RasterYSize="3600" DataType="Byte" BlockXSize="2400" BlockYSize="1" />
      <SrcRect xOff="0" yOff="0" xSize="2400" ySize="3600" />
      <DstRect xOff="2400" yOff="0" xSize="2400" ySize="3600" />
    </SimpleSource>
  </VRTRasterBand>
  <VRTRasterBand dataType="Byte" band="3">
    <ColorInterp>Blue</ColorInterp>
    <SimpleSource>
      <SourceFilename relativeToVRT="1">small/2018-09-01_2019-04-30_CC05.tif</SourceFilename>
      <SourceBand>3</SourceBand>
      <SourceProperties RasterXSize="2400" RasterYSize="3600" DataType="Byte" BlockXSize="2400" BlockYSize="1" />
      <SrcRect xOff="0" yOff="0" xSize="2400" ySize="3600" />
      <DstRect xOff="0" yOff="0" xSize="2400" ySize="3600" />
    </SimpleSource>
    <SimpleSource>
      <SourceFilename relativeToVRT="1">small/2018-09-01_2019-04-30_CC06.tif</SourceFilename>
      <SourceBand>3</SourceBand>
      <SourceProperties RasterXSize="2400" RasterYSize="3600" DataType="Byte" BlockXSize="2400" BlockYSize="1" />
      <SrcRect xOff="0" yOff="0" xSize="2400" ySize="3600" />
      <DstRect xOff="2400" yOff="0" xSize="2400" ySize="3600" />
    </SimpleSource>
  </VRTRasterBand>
</VRTDataset>
`.trim();

o.spec('VDOM Parser', () => {
  o('should base basic dom', async () => {
    const node = await VNodeParser.parse('<div></div>');
    o(node.toString()).equals('<div />');
  });

  o('should base basic attrs', async () => {
    const node = await VNodeParser.parse('<div class="foo" style="height:5px"></div>');
    o(node.attrs).deepEquals({ class: 'foo', style: 'height:5px' });
    o(node.toString()).equals('<div class="foo" style="height:5px" />');
  });

  o('should parse children', async () => {
    const node = await VNodeParser.parse('<div><span>Hello</span></div>');
    o(node.tag).equals('div');
    o(node.children.length).equals(1);
    o(node.children[0].toString()).equals('<span>Hello</span>');
  });

  o('should parse a vrt', async () => {
    const node = await VNodeParser.parse(VrtExample);
    o(node.toString()).equals(VrtExample);
  });
});

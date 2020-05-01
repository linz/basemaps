import { FileOperatorSimple, LogConfig } from '@basemaps/lambda-shared';
import { FeatureCollection } from 'geojson';
import * as o from 'ospec';
import { Cutline } from '../cutline';
import { QuadKeyVrt } from '../quadkey.vrt';
import { SourceTiffTestHelper } from './source.tiff.testhelper';

o.spec('quadkey.vrt', () => {
    const tmpFolder = '/tmp/my-tmp-folder';

    const job = SourceTiffTestHelper.makeCogJob();

    const logger = LogConfig.get();
    LogConfig.disable();

    o.beforeEach(() => {
        job.source.resolution = 13;
        job.source.files = [];
    });

    const SimpleSource = `<SimpleSource>
      <SourceFilename relativeToVRT="0">__TIFF__</SourceFilename>
      <SourceBand>__SRC_BAND__</SourceBand>
      <SourceProperties RasterXSize="24" RasterYSize="36" DataType="Byte" BlockXSize="24" BlockYSize="1" />
      <SrcRect xOff="0" yOff="0" xSize="24" ySize="36" />
      <DstRect xOff="0" yOff="0" xSize="24" ySize="36" />
</SimpleSource>`;

    const ComplexSource = `<ComplexSource>
      <SourceFilename relativeToVRT="0">__TIFF__</SourceFilename>
      <SourceBand>1</SourceBand>
      <SourceProperties RasterXSize="24" RasterYSize="36" DataType="Byte" BlockXSize="24" BlockYSize="1" />
      <SrcRect xOff="0" yOff="0" xSize="24" ySize="36" />
      <DstRect xOff="0" yOff="0" xSize="24" ySize="36" />
      <ScaleOffset>255</ScaleOffset>
      <ScaleRatio>0</ScaleRatio>
    </ComplexSource>
`;

    const simpleSource = (path: string, srcBand: number): string =>
        SimpleSource.replace(/__TIFF__/, path).replace(/__SRC_BAND__/, String(srcBand));

    const complexSource = (path: string): string => ComplexSource.replace(/__TIFF__/, path);
    const testDir = `${process.cwd()}/__test.assets__`;

    o.spec('buildCutlineVrt', () => {
        const [tif1Path, tif2Path] = [1, 2].map((i) => `${testDir}/tif${i}.tiff`);

        const vtif1 = '/vsis3/' + tif1Path,
            vtif2 = '/vsis3/' + tif2Path;

        const [tif1Poly, tif2Poly] = SourceTiffTestHelper.tiffPolygons();

        const sourceGeo = {
            type: 'FeatureCollection',
            features: [],
        } as FeatureCollection;

        function makeVrtString(tifs: string[] = [tif1Path, tif2Path], bandTotal = 2): string {
            job.source.files = tifs;
            const bands = ['red', 'green', 'blue', 'alpha'];

            const rasterBands = bands.slice(0, bandTotal).map(
                (c, i) => `
  <VRTRasterBand dataType="Byte" band="${i + 1}">
    <HideNoDataValue>1</HideNoDataValue>
    <ColorInterp>${c}</ColorInterp>
    ${tifs.map((n) => (c === 'alpha' ? complexSource(n) : simpleSource('/vsis3/' + n, i + 1))).join('\n')}
  </VRTRasterBand>`,
            );

            return `<VRTDataset rasterXSize="24" rasterYSize="36"><SRS />${rasterBands}</VRTDataset>`;
        }

        const origFileOperatorWriteJson = FileOperatorSimple.writeJson;

        o.after(() => {
            FileOperatorSimple.writeJson = origFileOperatorWriteJson;
        });

        let cutTiffArgs: Array<Array<any>> = [];

        o.beforeEach(() => {
            sourceGeo.features = SourceTiffTestHelper.makeTiffFeatureCollection(
                [tif1Poly, tif2Poly],
                [tif1Path, tif2Path],
            ).features;

            cutTiffArgs = [];
            FileOperatorSimple.writeJson = ((...args: any): any => {
                cutTiffArgs.push(args);
            }) as any;

            job.output.cutlineBlend = undefined;
        });

        o('1 crosses, 1 outside', async () => {
            const cutline = await Cutline.loadCutline(testDir + '/kapiti.geojson');
            const cl2 = await Cutline.loadCutline(testDir + '/mana.geojson');
            cutline.polygons.push(...cl2.polygons);

            job.source.resolution = 17;

            await QuadKeyVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, makeVrtString(), '311333', logger);

            o(cutline.polygons.length).equals(2);
        });

        o('not within quadKey', async () => {
            const cutline = await Cutline.loadCutline(testDir + '/kapiti.geojson');

            const vrt = await QuadKeyVrt.buildVrt(
                tmpFolder,
                job,
                sourceGeo,
                cutline,
                makeVrtString(),
                '3131110001',
                logger,
            );

            o(cutTiffArgs.length).equals(0);

            o(Array.from(vrt.tags('SourceFilename')).map((e) => e.textContent)).deepEquals([]);
        });

        o('no cutline', async () => {
            const vrt = await QuadKeyVrt.buildVrt(
                tmpFolder,
                job,
                sourceGeo,
                new Cutline(),
                makeVrtString(),
                '31',
                logger,
            );

            o(Array.from(vrt.tags('SourceFilename')).map((e) => e.textContent)).deepEquals([
                vtif1,
                vtif2,
                vtif1,
                vtif2,
            ]);
            o(cutTiffArgs.length).equals(0);
        });

        o('fully within', async () => {
            const cutline = await Cutline.loadCutline(testDir + '/kapiti.geojson');

            const qkey = '3113332223211133012';

            const vrt = await QuadKeyVrt.buildVrt(tmpFolder, job, sourceGeo, cutline, makeVrtString(), qkey, logger);

            o(Array.from(vrt.tags('SourceFilename')).map((e) => e.textContent)).deepEquals([vtif2, vtif2]);
            o(cutTiffArgs.length).equals(0);
        });

        o('1 surrounded', async () => {
            job.output.cutlineBlend = 10;
            const cutline = await Cutline.loadCutline(testDir + '/mana.geojson');

            const vrt = await QuadKeyVrt.buildVrt(
                tmpFolder,
                job,
                sourceGeo,
                cutline,
                makeVrtString(),
                '3131110001',
                logger,
            );

            o(cutTiffArgs.length).equals(1);
            o(cutTiffArgs[0][0]).equals(tmpFolder + '/cutline.geojson');

            o(cutline.polygons.length).equals(1);

            const geo = cutline.toGeoJson();

            o(geo.type).equals('FeatureCollection');
            if (geo.type === 'FeatureCollection') {
                o(geo.features).deepEquals([
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'MultiPolygon',
                            coordinates: (geo.features[0].geometry as any).coordinates,
                        },
                    },
                ]);
            }

            o(Array.from(vrt.tags('SourceFilename')).map((e) => e.textContent)).deepEquals([
                vtif1,
                vtif2,
                vtif1,
                vtif2,
            ]);
        });
    });
});

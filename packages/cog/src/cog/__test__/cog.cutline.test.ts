import { FileOperatorSimple, LogConfig } from '@basemaps/lambda-shared';
import { polygon } from '@turf/helpers';
import { FeatureCollection, Position } from 'geojson';
import * as o from 'ospec';
import 'source-map-support/register';
import { CogJob } from '../cog';
import { Cutline } from '../cog.cutline';

o.spec('cog.cutline', () => {
    const tmpFolder = '/tmp/my-tmp-folder';

    const job = {
        source: {
            files: [] as string[],
            options: {
                maxConcurrency: 3,
                maxCogs: 3,
                minZoom: 1,
            },
        },
        output: {
            cutline: '',
        },
    } as CogJob;

    const logger = LogConfig.get();
    LogConfig.disable();

    o.afterEach(() => {
        job.output.cutline = '';
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

    o.spec('buildCutlineVrt', () => {
        const testDir = `${process.cwd()}/__test.assets__`;

        const [tif1, tif2] = [1, 2].map((i) => `${testDir}/tif${i}.tiff`);

        const tif1Poly = [
            [174.56568549279925, -40.83842049282911],
            [174.57337757492053, -41.162595138463644],
            [174.85931317513828, -41.15833331417625],
            [174.85022498195937, -40.834206771481526],
            [174.56568549279925, -40.83842049282911],
        ];

        const tif2Poly = [
            [174.85022498195937, -40.834206771481526],
            [174.85931317513828, -41.15833331417625],
            [175.14518230301843, -41.15336229204068],
            [175.13469922175867, -40.829291849263555],
            [174.85022498195937, -40.834206771481526],
        ];

        const makePoly = (poly: Position[], path: string): any => polygon([poly], { tiff: path });

        const sourceGeo = {
            type: 'FeatureCollection',
            features: [],
        } as FeatureCollection;

        function makeVrtString(tifs: string[] = [tif1, tif2], bandTotal = 2): string {
            job.source.files = tifs;
            const bands = ['red', 'green', 'blue', 'alpha'];

            const rasterBands = bands.slice(0, bandTotal).map(
                (c, i) => `
  <VRTRasterBand dataType="Byte" band="${i + 1}">
    <HideNoDataValue>1</HideNoDataValue>
    <ColorInterp>${c}</ColorInterp>
    ${tifs.map((n) => (c === 'alpha' ? complexSource(n) : simpleSource(n, i + 1))).join('\n')}
  </VRTRasterBand>`,
            );

            return `<VRTDataset rasterXSize="24" rasterYSize="36"><SRS />${rasterBands}</VRTDataset>`;
        }

        const origWriteCutline = Cutline.writeCutline;

        o.after(() => {
            Cutline.writeCutline = origWriteCutline;
        });

        let cutTiffArgs: Array<Array<any>> = [];

        o.beforeEach(() => {
            sourceGeo.features = [makePoly(tif1Poly, tif1), makePoly(tif2Poly, tif2)] as any;

            cutTiffArgs = [];
            Cutline.writeCutline = ((...args: any): string => {
                cutTiffArgs.push(args);
                return 'cut//' + args[0];
            }) as any;

            job.output.cutline = job.output.cutlineBlend = undefined;
        });

        o('1 crosses, 1 outside', async () => {
            job.output.cutline = testDir + '/kapiti.geojson';

            const vrt = await Cutline.buildVrt(tmpFolder, job, sourceGeo, makeVrtString(), '313', logger);

            o(Array.from(vrt.tags('SourceFilename')).map((e) => e.textContent)).deepEquals([tif2, tif2]);
        });

        o('not within quadKey', async () => {
            job.output.cutline = testDir + '/kapiti.geojson';

            const vrt = await Cutline.buildVrt(tmpFolder, job, sourceGeo, makeVrtString(), '3131110001', logger);

            o(Array.from(vrt.tags('SourceFilename')).map((e) => e.textContent)).deepEquals([]);
            o(cutTiffArgs.length).equals(0);
        });

        o('no cutline', async () => {
            const vrt = await Cutline.buildVrt(tmpFolder, job, sourceGeo, makeVrtString(), '31', logger);

            o(Array.from(vrt.tags('SourceFilename')).map((e) => e.textContent)).deepEquals([tif1, tif2, tif1, tif2]);
            o(cutTiffArgs.length).equals(0);
        });

        o('fully within', async () => {
            job.output.cutline = testDir + '/kapiti.geojson';

            const qkey = '3113332223211133012';

            const vrt = await Cutline.buildVrt(tmpFolder, job, sourceGeo, makeVrtString(), qkey, logger);

            o(Array.from(vrt.tags('SourceFilename')).map((e) => e.textContent)).deepEquals([tif2, tif2]);
            o(cutTiffArgs.length).equals(0);
        });

        o('1 surrounded', async () => {
            job.output.cutline = testDir + '/mana.geojson';
            job.output.cutlineBlend = 10;

            const vrt = await Cutline.buildVrt(tmpFolder, job, sourceGeo, makeVrtString(), '3131110001', logger);

            o(cutTiffArgs.length).equals(1);
            o(cutTiffArgs[0][1]).equals(tmpFolder);
            const cutline = cutTiffArgs[0][0] as FeatureCollection;

            o(cutline.type).equals('FeatureCollection');
            if (cutline.type === 'FeatureCollection') {
                o(cutline.features).deepEquals([
                    {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Polygon',
                            coordinates: (cutline.features[0].geometry as any).coordinates,
                        },
                    },
                ]);
            }

            o(Array.from(vrt.tags('SourceFilename')).map((e) => e.textContent)).deepEquals([tif1, tif1]);
        });
    });

    o.spec('writeCutline', () => {
        const origWrite = FileOperatorSimple.write;
        o.afterEach(() => {
            FileOperatorSimple.write = origWrite;
        });

        o('writeCutline', async () => {
            const cutline = { name: 'my-cutline' } as any;
            const write = o.spy();
            FileOperatorSimple.write = write as any;
            const tmpFolder = '/tmp/basemaps-123';
            const cutPath = await Cutline.writeCutline(cutline, tmpFolder);

            const expPath = '/tmp/basemaps-123/cutline.geojson';

            o(cutPath).equals(expPath);

            o(write.args).deepEquals([expPath, Buffer.from(JSON.stringify(cutline))]);
        });
    });
});

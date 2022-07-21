import { Bounds, Epsg, EpsgCode, GoogleTms, Nztm2000Tms, Stac, StacCollection } from '@basemaps/geo';
import { Projection } from '@basemaps/shared';
import { mockFileOperator } from '@basemaps/shared/build/file/__tests__/file.operator.test.helper.js';
import { round } from '@basemaps/test/build/rounding.js';
import { Ring } from '@linzjs/geojson';
import o from 'ospec';
import { CogStacJob, JobCreationContext } from '../cog.stac.job.js';
import { CogBuilderMetadata, CogJobJson } from '../types.js';

type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};
o.spec('CogJob', () => {
  o.spec('build', () => {
    const id = 'jobid1';
    const imageryName = 'auckland_rural_2010-2012_0-50m';

    const jobPath = 's3://target-bucket/path/3857/auckland_rural_2010-2012_0-50m/jobid1';

    const ring1 = [
      [170, -41],
      [-175, -40],
      [-177, -42],
      [175, -42],
      [170, -41],
    ].map(Projection.get(Epsg.Nztm2000).fromWgs84) as Ring;
    const ring2 = [
      [-150, -40],
      [-140, -41],
      [-150, -41],
      [-150, -40],
    ].map(Projection.get(Epsg.Nztm2000).fromWgs84) as Ring;

    const srcPoly = [[ring1], [ring2]];
    const bounds = srcPoly.map((poly, i) => ({ ...Bounds.fromMultiPolygon([poly]), name: 'ring' + i }));

    const metadata: CogBuilderMetadata = {
      bands: 3,
      bounds,
      projection: EpsgCode.Nztm2000,
      pixelScale: 0.075,
      resZoom: 22,
      nodata: 0,
      files: [{ name: '0-0-0', x: 1, y: 2, width: 2, height: 3 }],
      targetBounds: { x: 1, y: 2, width: 2, height: 3 },
    };
    const addAlpha = true;
    const ctx = {
      tileMatrix: GoogleTms,
      sourceLocation: { type: 's3', path: 's3://source-bucket/path' },
      outputLocation: { type: 's3', path: 's3://target-bucket/path' },
      cutline: { blend: 20, href: 's3://curline-bucket/path' },
      oneCogCovering: false,
    } as JobCreationContext;

    const mockFs = mockFileOperator();

    o.beforeEach(mockFs.setup);

    o.afterEach(mockFs.teardown);

    o('with job.json', async () => {
      mockFs.jsStore['s3://source-bucket/path/collection.json'] = {
        title: 'The Title',
        description: 'The Description',
        license: 'The License',
        keywords: ['keywords'],
        extent: {
          spatial: { bbox: [9, 8, 7, 6] },
          temporal: { interval: [['2020-01-01T00:00:00.000', '2020-08-08T19:18:23.456Z']] },
        },

        providers: [
          { name: 'provider name', roles: ['licensor'], url: 'https://provider.com' },
          { name: 'unknown url', roles: ['processor'], url: 'unknown' },
        ],
      };
      const job = await CogStacJob.create({ id, imageryName, metadata, ctx, addAlpha, cutlinePoly: [] });
      o(job.getJobPath('job.json')).equals(jobPath + '/job.json');

      o(job.title).equals('The Title');
      o(job.description).equals('The Description');

      const stac = round(mockFs.jsStore[jobPath + '/collection.json'], 4);

      o(stac.title).equals('The Title');
      o(stac.description).equals('The Description');
      o(stac.license).equals('The License');
      o(stac.keywords).deepEquals(['keywords']);
      o(stac.providers).deepEquals([
        { name: 'provider name', roles: ['licensor'], url: 'https://provider.com' },
        { name: 'unknown url', roles: ['processor'], url: undefined },
      ]);
      o(stac.links[2]).deepEquals({
        href: 's3://source-bucket/path/collection.json',
        rel: 'sourceImagery',
        type: 'application/json',
      });
      o(round(stac.extent.spatial.bbox, 4)).deepEquals([[169.3347, -51.868, -145.9143, -32.8496]]);
      o(stac.extent.temporal).deepEquals({ interval: [['2020-01-01T00:00:00.000', '2020-08-08T19:18:23.456Z']] });
    });

    o('no source collection.json', async () => {
      const startNow = Date.now();
      const job = await CogStacJob.create({
        id,
        imageryName,
        metadata,
        ctx: { ...ctx, oneCogCovering: true },
        addAlpha,
        cutlinePoly: [],
      });
      const afterNow = Date.now();
      const jobJson = round(job.json, 4) as CogJobJson;

      o(jobJson).deepEquals(round(mockFs.jsStore[jobPath + '/job.json'], 4));
      o(jobJson.id).equals('jobid1');
      o(jobJson.name).equals('auckland_rural_2010-2012_0-50m');
      o(jobJson.title).equals('Auckland rural 2010-2012 0.50m');
      o(jobJson.description).equals('No description');
      o(jobJson.source.gsd).equals(0.075);
      o(jobJson.source.epsg).equals(2193);
      o(jobJson.source.files[0]).deepEquals({
        x: 1347679.1521,
        y: 5301577.5262,
        width: 1277913.1293,
        height: 201072.641,
        name: 'ring0',
      });
      o(jobJson.source.files[1]).deepEquals({
        x: 4728648.2332,
        y: 4247288.7253,
        width: 837784.3351,
        height: 609622.9622,
        name: 'ring1',
      });
      o(jobJson.source.location).deepEquals({ type: 's3', path: 's3://source-bucket/path' });
      o(jobJson.output.gsd).equals(0.0373);
      o(jobJson.output.epsg).equals(3857);
      o(jobJson.output.tileMatrix).equals('WebMercatorQuad');
      o(jobJson.output.files).deepEquals([{ name: '0-0-0', x: 1, y: 2, width: 2, height: 3 }]);
      o(jobJson.output.location).deepEquals({ type: 's3', path: 's3://target-bucket/path' });
      o(jobJson.output.resampling).deepEquals({ warp: 'bilinear', overview: 'lanczos' });
      o(jobJson.output.quality).equals(90);
      o(jobJson.output.cutline).deepEquals({ blend: 20, href: 's3://curline-bucket/path' });
      o(jobJson.output.addAlpha).equals(true);
      o(jobJson.output.nodata).equals(0);
      o(jobJson.output.bounds).deepEquals({ x: 1, y: 2, width: 2, height: 3 });

      o(job.id).equals(id);
      o(job.source.gsd).equals(0.075);
      o(round(job.output.gsd, 4)).equals(0.0373);
      o(job.output.oneCogCovering).equals(true);

      const stac = round(mockFs.jsStore[jobPath + '/collection.json'], 4) as StacCollection;

      const stacMeta = stac.summaries as any;

      const generated = stacMeta['linz:generated'][0];

      const jobNow = +Date.parse(generated.datetime);
      o(startNow <= jobNow && jobNow <= afterNow).equals(true);

      // split so that scripts/detect.unlinked.dep.js does not think it is an import
      o(generated.package).equals('@' + 'basemaps/cli');
      o(stac.id).equals(job.id);
      o(stac.extent.spatial.bbox).deepEquals([[169.3347, -51.868, -145.9143, -32.8496]]);
      o(stac.extent.temporal).deepEquals({ interval: [['2010-01-01T00:00:00Z', '2011-01-01T00:00:00Z']] });
      o(stac.stac_version).equals(Stac.Version);
      o(stac.stac_extensions).deepEquals([Stac.BaseMapsExtension]);
      o(stac.license).deepEquals(Stac.License);
      o(stac.keywords).deepEquals(['Imagery', 'New Zealand']);
      o(stac.summaries).deepEquals({
        gsd: [0.075],
        'proj:epsg': [3857],
        'linz:output': [
          {
            resampling: { warp: 'bilinear', overview: 'lanczos' },
            quality: 90,
            cutlineBlend: 20,
            addAlpha: true,
            nodata: 0,
          },
        ],
        'linz:generated': [generated],
      });
      o(stac.links).deepEquals([
        { href: 's3://target-bucket/path/collection.json', type: 'application/json', rel: 'self' },
        { href: 'job.json', type: 'application/json', rel: 'linz.basemaps.job' },
        { href: 'cutline.geojson.gz', type: 'application/geo+json+gzip', rel: 'linz.basemaps.cutline' },
        { href: 'covering.geojson', type: 'application/geo+json', rel: 'linz.basemaps.covering' },
        { href: 'source.geojson', type: 'application/geo+json', rel: 'linz.basemaps.source' },
        { href: '0-0-0.json', type: 'application/geo+json', rel: 'item' },
      ]);

      o(round(mockFs.jsStore[jobPath + '/cutline.geojson.gz'], 4)).deepEquals({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'MultiPolygon', coordinates: [] },
            properties: {},
          },
        ],
        crs: {
          type: 'name',
          properties: { name: 'urn:ogc:def:crs:EPSG::3857' },
        },
      });

      o(round(mockFs.jsStore[jobPath + '/0-0-0.json'], 4)).deepEquals({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [0, 0],
              [0, 0],
              [0, 0],
              [0, 0],
            ],
          ],
        },
        properties: {
          datetime: new Date(jobNow).toISOString(),
          name: '0-0-0',
          gsd: 0.0373,
          'proj:epsg': 3857,
        },
        bbox: [0, 0, 0, 0],
        id: 'jobid1/0-0-0',
        collection: 'jobid1',
        stac_version: Stac.Version,
        stac_extensions: ['projection'],
        links: [
          { href: jobPath + '/0-0-0.json', rel: 'self' },
          { href: 'collection.json', rel: 'collection' },
        ],
        assets: {
          cog: {
            href: '0-0-0.tiff',
            type: 'image/tiff; application=geotiff; profile=cloud-optimized',
            roles: ['data'],
          },
        },
      });
      o(round(mockFs.jsStore[jobPath + '/covering.geojson'], 4)).deepEquals({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [0, 0],
                  [0, 0],
                  [0, 0],
                  [0, 0],
                  [0, 0],
                ],
              ],
            },
            properties: { name: '0-0-0' },
            bbox: [0, 0, 0, 0],
          },
        ],
      });

      const sourceGeoJson = mockFs.jsStore[jobPath + '/source.geojson'];
      o(sourceGeoJson.type).equals('FeatureCollection');
      o(sourceGeoJson.features.length).equals(2);
      o(round(sourceGeoJson.features[0], 4)).deepEquals({
        type: 'Feature',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [169.9343, -42.3971],
                [180, -42.2199],
                [180, -40.4109],
                [170.0185, -40.5885],
                [169.9343, -42.3971],
              ],
            ],
            [
              [
                [-180, -42.2199],
                [-174.6708, -41.7706],
                [-175, -40],
                [-180, -40.4109],
                [-180, -42.2199],
              ],
            ],
          ],
        },
        properties: { name: 'ring0' },
        bbox: [169.9343, -42.3971, -175, -40],
      });

      o(round(sourceGeoJson.features[1], 4)).deepEquals({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [-147.4403, -44.5167],
              [-150.5162, -40.1908],
              [-143.1693, -37.1443],
              [-140, -41],
              [-147.4403, -44.5167],
            ],
          ],
        },
        properties: { name: 'ring1' },
        bbox: [-147.4403, -44.5167, -143.1693, -37.1443],
      });
    });

    o('should create with no tileMatrix', () => {
      const cfg: RecursivePartial<CogJobJson> = { output: { epsg: 2193 } };
      const job = new CogStacJob(cfg as CogJobJson);
      o(job.tileMatrix.identifier).equals(Nztm2000Tms.identifier);
    });

    o('should error with invalid tileMatrix', () => {
      const cfg: RecursivePartial<CogJobJson> = { output: { tileMatrix: 'None' } };
      const job = new CogStacJob(cfg as CogJobJson);
      o(() => job.tileMatrix).throws('Failed to find TileMatrixSet "None"');
    });

    o('no source collection.json and not nice name', async () => {
      try {
        await CogStacJob.create({
          id,
          imageryName: 'yucky-name',
          metadata,
          ctx: { ...ctx, oneCogCovering: true },
          addAlpha,
          cutlinePoly: [],
        });
        o('').equals('create should not have exceeded');
      } catch (err: any) {
        o(err.message).equals('Missing date in imagery name: yucky-name');
      }
    });
  });
});

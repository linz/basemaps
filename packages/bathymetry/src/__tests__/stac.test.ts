/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import assert from 'node:assert';
import { writeFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { GoogleTms } from '@basemaps/geo';
import { fsa, FsMemory, LogConfig, LogType } from '@basemaps/shared';
import { round } from '@basemaps/test/build/rounding.js';
import { dirname } from 'path';

import { FilePath } from '../file.js';
import { Hash } from '../hash.js';
import { Stac } from '../stac.js';

describe('stac', () => {
  const origHash = Hash.hash;

  // const mockFs = mockFileOperator();

  const fsMemory = new FsMemory();
  beforeEach(() => {
    fsa.register('memory://', fsMemory);
  });

  afterEach(() => {
    Hash.hash = origHash;
    fsMemory.files.clear();
  });

  it('createItem', async () => {
    (Hash as any).hash = (v: string): string => 'hash' + v;

    const bm = {
      id: 'id123',
      tileMatrix: GoogleTms,
      inputPath: 's3://test-source-bucket/gebco-2020/',
      outputPath: 's3://test-bucket/bathy-2020/',
      tmpFolder: new FilePath('/tmp/path'),
    } as any;
    bm.config = bm;

    const now = Date.now();

    const stac = round(await Stac.createItem(bm, { x: 22, y: 33, z: 13 }));

    const date = Date.parse(stac.properties['datetime'] as string);

    assert.equal(date >= now && date < now + 2000, true);

    assert.deepEqual(round(stac, 4), {
      stac_version: Stac.Version,
      stac_extensions: ['projection', Stac.BaseMapsExtension],
      id: 'id123/13-22-33',
      collection: 'id123',
      type: 'Feature',
      bbox: [-179.0332, 84.9205, -178.9893, 84.9244],
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-179.0332, 84.9205],
            [-179.0332, 84.9244],
            [-178.9893, 84.9244],
            [-178.9893, 84.9205],
            [-179.0332, 84.9205],
          ],
        ],
      },
      properties: {
        datetime: stac.properties['datetime'] as string,
        'checksum:multihash': 'hash/tmp/path/output/13-22-33.tiff',
        'proj:epsg': 3857,
        'linz:gdal:version': undefined,
        'linz:tile_matrix_set': 'WebMercatorQuad',
      },
      assets: {
        tiff: {
          href: '13-22-33.tiff',
          title: 'GeoTiff',
          roles: ['data'],
          type: 'image/tiff; application=geotiff',
        },
      },
      links: [{ rel: 'collection', href: 'collection.json' }],
    });
  });

  describe('createCollection', () => {
    const logger = LogConfig.get();
    LogConfig.disable();
    const bm = {
      id: 'id123',
      tileMatrix: GoogleTms,
      inputPath: 'memory://test-source-bucket/gebco-2020/gebco_2020.nc',
      outputPath: 'memory://test-bucket/bathy-2020/',
      tmpFolder: new FilePath('/tmp/path'),
      createSourceHash(l: LogType) {
        return 'multihashResult' + (l === logger);
      },
      get inputFolder(): string {
        return dirname(this.inputPath);
      },
    } as any;
    bm.config = bm;

    it('createCollection without source collection.json', async () => {
      const bounds = GoogleTms.tileToSourceBounds({ x: 1, y: 2, z: 4 });

      const items = ['1-1-2.json'];
      const stac = await Stac.createCollection(bm, bounds, items, logger);

      assert.deepEqual(round(stac, 4), {
        stac_version: Stac.Version,
        stac_extensions: ['projection'],
        id: 'id123',
        title: 'Gebco 2020.nc',
        description: 'No description',
        extent: {
          spatial: { bbox: [[-157.5, 74.0195, -135, 79.1713]] },
          temporal: {
            interval: [['2020-01-01T00:00:00Z', '2021-01-01T00:00:00Z']],
          },
        },
        license: Stac.License,
        links: stac.links,
        providers: [
          {
            name: 'Land Information New Zealand',
            url: 'https://www.linz.govt.nz/',
            roles: ['processor'],
          },
        ],
        keywords: ['Bathymetry'],
        summaries: { 'proj:epsg': [3857] },
      });
    });

    it('createCollection with source collection.json', async () => {
      await fsa.write(
        fsa.toUrl('memory://test-source-bucket/gebco-2020/collection.json'),
        JSON.stringify({
          title: 'fancy title',
          description: 'collection description',
          providers: [{ name: 'source provider', roles: ['source'] }],
          extent: {
            spatial: { bbox: [[-180, 84, -178, 85]] },
            temporal: { interval: [['2020-01-01T00:00:00Z', '2020-10-12T01:02:03Z']] },
          },
        }),
      );

      const bounds = GoogleTms.tileToSourceBounds({ x: 22, y: 33, z: 13 });

      const items = ['13-22-33.json', '13-22-34.json'];
      const stac = await Stac.createCollection(bm, bounds, items, logger);

      const gitHubLink = stac.links[2];
      assert.equal(gitHubLink.href.startsWith('https://github.com/linz/basemaps.git'), true);
      assert.equal(gitHubLink.rel, 'derived_from');
      assert.equal(/^\d+\.\d+\.\d+$/.test(gitHubLink['version'] as string), true);

      writeFileSync('./output', JSON.stringify(stac, null, 2));

      assert.deepEqual(round(stac, 4), {
        stac_version: Stac.Version,
        stac_extensions: ['projection'],
        id: 'id123',
        title: 'fancy title',
        description: 'collection description',
        extent: {
          spatial: { bbox: [[-179.0332, 84.9205, -178.9893, 84.9244]] },
          temporal: { interval: [['2020-01-01T00:00:00Z', '2020-10-12T01:02:03Z']] },
        },
        license: Stac.License,
        links: [
          {
            rel: 'self',
            href: 'memory://test-bucket/bathy-2020/collection.json',
          },
          {
            rel: 'derived_from',
            href: 'memory://test-source-bucket/gebco-2020/gebco_2020.nc',
            'checksum:multihash': 'multihashResulttrue',
          },
          gitHubLink,

          { rel: 'item', href: '13-22-33.json', type: 'application/geo+json' },
          { rel: 'item', href: '13-22-34.json', type: 'application/geo+json' },
          {
            href: 'memory://test-source-bucket/gebco-2020/collection.json',
            rel: 'sourceImagery',
            type: 'application/json',
          },
        ],
        providers: [
          {
            name: 'Land Information New Zealand',
            url: 'https://www.linz.govt.nz/',
            roles: ['processor'],
          },
          { name: 'source provider', roles: ['source'] },
        ],
        keywords: ['Bathymetry'],
        summaries: { 'proj:epsg': [3857] },
      });
    });
  });
});

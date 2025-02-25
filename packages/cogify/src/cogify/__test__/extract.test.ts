import { strictEqual, throws } from 'node:assert';
import { basename } from 'node:path';
import { describe, it } from 'node:test';

import { extractMapCodeAndVersion } from '../topo/extract.js';

describe('extractMapCodeAndVersion', () => {
  const FakeDomain = 's3://topographic/fake-domain';
  const validFiles = [
    { input: `${FakeDomain}/MB07_GeoTifv1-00.tif`, expected: { mapCode: 'MB07', version: 'v1-00' } },
    { input: `${FakeDomain}/MB07_GRIDLESS_GeoTifv1-00.tif`, expected: { mapCode: 'MB07', version: 'v1-00' } },
    { input: `${FakeDomain}/MB07_TIFFv1-00.tif`, expected: { mapCode: 'MB07', version: 'v1-00' } },
    { input: `${FakeDomain}/MB07_TIFF_600v1-00.tif`, expected: { mapCode: 'MB07', version: 'v1-00' } },
    {
      input: `${FakeDomain}/AX32ptsAX31AY31AY32_GeoTifv1-00.tif`,
      expected: { mapCode: 'AX32ptsAX31AY31AY32', version: 'v1-00' },
    },
    {
      input: `${FakeDomain}/AZ36ptsAZ35BA35BA36_GeoTifv1-00.tif`,
      expected: { mapCode: 'AZ36ptsAZ35BA35BA36', version: 'v1-00' },
    },
  ];
  const invalidFiles = [`${FakeDomain}/MB07_GeoTif1-00.tif`, `${FakeDomain}/MB07_TIFF_600v1.tif`];

  it('should parse the correct MapSheet Names', () => {
    for (const file of validFiles) {
      const output = extractMapCodeAndVersion(new URL(file.input));
      strictEqual(output.mapCode, file.expected.mapCode, 'Map code does not match');
      strictEqual(output.version, file.expected.version, 'Version does not match');
    }
  });

  it('should not able to parse a version from file', () => {
    for (const file of invalidFiles) {
      throws(() => extractMapCodeAndVersion(new URL(file)), new Error(`Version not found in the file name: "${file}"`));
    }
  });
});

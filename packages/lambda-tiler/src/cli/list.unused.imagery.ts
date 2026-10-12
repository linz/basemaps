import { parseArgs } from 'node:util';

import type { ConfigBundled } from '@basemaps/config';
import { fsa, LogConfig } from '@basemaps/shared';
import type { FileInfo } from '@chunkd/fs';

import { findUnusedImagery, getReferencedLocations, ImageryPrefixes } from './unused.imagery.js';

const { values } = parseArgs({
  options: {
    bucket: { type: 'string', default: 's3://linz-basemaps/' },
    config: { type: 'string', default: 's3://linz-basemaps/config/config-latest.json.gz' },

    output: { type: 'string', default: 'unused-imagery.json' },
    help: { type: 'boolean', default: false },
  },
});

if (values.help) {
  // eslint-disable-next-line no-console
  console.log(`Usage: list-unused-imagery [options]

  Find imagery and elevation imports that are not referenced by any config, vector data is not checked.
  This only lists the imports, nothing is deleted.

  --bucket <url>                  Bucket to check (default: s3://linz-basemaps/)
  --config <url>                  Additional config to check, can be repeated eg a nonprod config
  --output <path>                 Write the unused imports as JSON (default: unused-imagery.json)
  `);
  process.exit(0);
}

/** Approximate cost of S3 Standard storage in ap-southeast-2 (USD per GB-month) */
const StandardCostPerGb = 0.024;

function toGb(bytes: number): number {
  return Math.round((bytes / 1024 ** 3) * 10) / 10;
}

async function main(): Promise<void> {
  const log = LogConfig.get();
  const bucket = fsa.toUrl(values.bucket.endsWith('/') ? values.bucket : values.bucket + '/');

  // Find every config to check

  const referenced = new Set<string>();
  const json = await fsa.readJson<ConfigBundled>(fsa.toUrl(values.config));
  getReferencedLocations(json, bucket, referenced);
  log.info({ configs: values.config, referenced: referenced.size }, 'Config:Loaded');

  const files: FileInfo[] = [];

  await Promise.all(
    ImageryPrefixes.map(async (prefix) => {
      const startTime = performance.now();
      let count = 0;
      let size = 0;
      for await (const file of fsa.details(new URL(prefix, bucket))) {
        files.push(file);
        count++;
        if (file.size) size += file.size;
      }
      log.info({ prefix, files: count, sizeGb: toGb(size), duration: performance.now() - startTime }, 'Bucket:Listed');
    }),
  );

  const unused = findUnusedImagery(files, referenced);
  const totalSize = unused.reduce((total, f) => total + f.size, 0);

  await fsa.write(fsa.toUrl(values.output), JSON.stringify(unused, null, 2));

  // eslint-disable-next-line no-console
  console.table(
    unused
      .slice(0, 50)
      .map((f) => ({ location: f.location, files: f.files, gb: toGb(f.size), lastModified: f.lastModified })),
  );
  log.info(
    {
      unused: unused.length,
      totalGb: toGb(totalSize),
      estimatedCostPerMonth: Math.round(toGb(totalSize) * StandardCostPerGb),
      output: values.output,
    },
    'UnusedImagery:Done',
  );
}

main().catch((e) => {
  LogConfig.get().fatal({ err: e }, 'UnusedImagery:Failed');
  process.exit(1);
});

import o from 'ospec';
import { CogJob } from '../../../cog/types.js';
import { BatchJob, extractResolutionFromName } from '../batch.job.js';

o.spec('action.batch', () => {
  o('extractResolutionFromName', () => {
    o(extractResolutionFromName('2013')).equals(-1);
    o(extractResolutionFromName('new_zealand_sentinel_2018-19_10m')).equals(10000);
    o(extractResolutionFromName('abc2017def_1.00m')).equals(1000);
    o(extractResolutionFromName('wellington_urban_2017_0.10m')).equals(100);
    o(extractResolutionFromName('wellington_urban_2017_0-10m')).equals(100);
    o(extractResolutionFromName('wellington_urban_2017_1.00m')).equals(1000);
    o(extractResolutionFromName('wellington_urban_2017_0.025m')).equals(25);
  });

  o('should create valid jobNames', () => {
    const fakeJob = { id: '01FHRPYJ5FV1XAARZAC4T4K6MC', name: 'geographx_nz_texture_shade_2012_8-0m' } as CogJob;
    o(BatchJob.id(fakeJob, ['0'])).equals('01FHRPYJ5FV1XAARZAC4T4K6MC-9af5e139bbb3e502-0');

    fakeJob.name = 'ōtorohanga_urban_2021_0.1m_RGB';
    o(BatchJob.id(fakeJob, ['0'])).equals('01FHRPYJ5FV1XAARZAC4T4K6MC-5294acface81c107-0');
  });

  o('should truncate job names to 128 characters', () => {
    const fakeJob = { id: '01FHRPYJ5FV1XAARZAC4T4K6MC', name: 'geographx_nz_texture_shade_2012_8-0m' } as CogJob;

    o(
      BatchJob.id(fakeJob, [
        'this is a really long file name',
        'it should over flow 128 characters',
        'so it should be truncated at some point.tiff',
      ]),
    ).equals(
      '01FHRPYJ5FV1XAARZAC4T4K6MC-9af5e139bbb3e502-it should over flow 128 characters_so it should be truncated at some point.tiff_this',
    );
  });

  o('should prepare valid chunk jobs', async () => {
    const fakeGsd = 0.9;
    const ChunkJobSmall = { size: 4097, max: 50 };
    const ChunkJobMiddle = { size: 8193, max: 10 };
    const ChunkJobLarge = { size: 16384, max: 5 };
    const fakeFiles = [
      { name: '1-2-1', width: ChunkJobSmall.size * fakeGsd - 1 }, // Small Job
      { name: '1-2-2', width: ChunkJobSmall.size * fakeGsd - 1 }, // Small Job
      { name: '1-2-3', width: ChunkJobLarge.size * fakeGsd + 1 }, // Single Job
      { name: '1-2-4', width: ChunkJobMiddle.size * fakeGsd - 1 }, // Middle Job
      { name: '1-2-5', width: ChunkJobMiddle.size * fakeGsd - 1 }, // Middle Job
      { name: '1-2-6', width: ChunkJobLarge.size * fakeGsd + 0.1 }, // Single Job
      { name: '1-2-7', width: ChunkJobMiddle.size * fakeGsd - 1 }, // Middle Job
      { name: '1-2-8', width: ChunkJobLarge.size * fakeGsd - 1 }, // Large Job
      { name: '1-2-9', width: ChunkJobLarge.size * fakeGsd - 1 }, // Large Job
      { name: '1-2-10', width: ChunkJobLarge.size * fakeGsd - 1 }, // Large Job
      { name: '1-2-11', width: ChunkJobLarge.size * fakeGsd - 1 }, // Large Job
      { name: '1-2-12', width: ChunkJobLarge.size * fakeGsd - 1 }, // Large Job
      { name: '1-2-13', width: ChunkJobLarge.size * fakeGsd - 1 }, // Large Job
    ];

    const fakeJob = { id: '01FHRPYJ5FV1XAARZAC4T4K6MC', output: { files: fakeFiles, gsd: fakeGsd } } as CogJob;
    o(await BatchJob.getJobs(fakeJob)).deepEquals([
      [fakeFiles[2].name], // First single Job
      [fakeFiles[5].name], // Second single Job
      [fakeFiles[7].name, fakeFiles[8].name, fakeFiles[9].name, fakeFiles[10].name, fakeFiles[11].name], // Large Jobs first Chunk
      [fakeFiles[0].name, fakeFiles[1].name], // Small Jobs chunk
      [fakeFiles[3].name, fakeFiles[4].name, fakeFiles[6].name], // Middle Jobs chunk
      [fakeFiles[12].name], // Large Jobs second Chunk
    ]);
  });
});

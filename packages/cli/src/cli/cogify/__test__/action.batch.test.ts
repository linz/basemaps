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
});

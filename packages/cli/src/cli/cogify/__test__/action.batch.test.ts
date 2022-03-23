import o from 'ospec';
import { CogJob } from '../../../cog/types.js';
import { ActionBatchJob, extractResolutionFromName } from '../action.batch.js';

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
    o(ActionBatchJob.id(fakeJob, '0')).equals('01FHRPYJ5FV1XAARZAC4T4K6MC-9af5e139bbb3e502-0');

    fakeJob.name = 'ōtorohanga_urban_2021_0.1m_RGB';
    o(ActionBatchJob.id(fakeJob, '0')).equals('01FHRPYJ5FV1XAARZAC4T4K6MC-5294acface81c107-0');
  });
});

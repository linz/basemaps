import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

import { StacProvider } from '@basemaps/geo';

import { copyright, createLicensorAttribution } from '../utils.js';

const defaultAttribution = `${copyright} LINZ`;

describe('utils', () => {
  const FakeHost: StacProvider = {
    name: 'FakeHost',
    roles: ['host'],
  };
  const FakeLicensor1: StacProvider = {
    name: 'FakeLicensor1',
    roles: ['licensor'],
  };
  const FakeLicensor2: StacProvider = {
    name: 'FakeLicensor2',
    roles: ['licensor'],
  };

  it('default attribution: no providers', () => {
    const providers = undefined;
    const attribution = createLicensorAttribution(providers);

    strictEqual(attribution, defaultAttribution);
  });

  it('default attribution: empty providers', () => {
    const providers: StacProvider[] = [];
    const attribution = createLicensorAttribution(providers);

    strictEqual(attribution, defaultAttribution);
  });

  it('default attribution: one provider, no licensors', () => {
    const providers = [FakeHost];

    const attribution = createLicensorAttribution(providers);
    strictEqual(attribution, defaultAttribution);
  });

  it('custom attribution: one provider, one licensor', () => {
    const providers = [FakeLicensor1];

    const attribution = createLicensorAttribution(providers);
    strictEqual(attribution, `${copyright} ${FakeLicensor1.name}`);
  });

  it('custom attribution: two providers, one licensor', () => {
    const providers = [FakeHost, FakeLicensor1];

    const attribution = createLicensorAttribution(providers);
    strictEqual(attribution, `${copyright} ${FakeLicensor1.name}`);
  });

  it('custom attribution: two providers, two licensors', () => {
    const providers = [FakeLicensor1, FakeLicensor2];

    const attribution = createLicensorAttribution(providers);
    strictEqual(attribution, `${copyright} ${FakeLicensor1.name}, ${FakeLicensor2.name}`);
  });
});

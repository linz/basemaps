import assert from 'node:assert';
import { describe, it } from 'node:test';

import { Epsg, EpsgCode } from '../epsg.js';
import { Nztm2000Tms } from '../tms/nztm2000.js';

describe('Epsg', () => {
  it('should error on invalid epsg', () => {
    assert.throws(() => Epsg.get(-1 as EpsgCode), 'Invalid EPSG:-1');
  });

  it('should not allow duplicate EPSG codes', () => {
    assert.deepEqual(new Epsg(1 as EpsgCode).toJSON(), 1);
    assert.throws(() => new Epsg(1 as EpsgCode), `Duplicate EPSG code created: 1`);
  });

  it('should parse Epsg codes', () => {
    assert.equal(Epsg.parse('Gogle'), null);
    assert.equal(Epsg.parse('google'), Epsg.Google);
    assert.equal(Epsg.parse('3857'), Epsg.Google);
    assert.equal(Epsg.parse('urn:ogc:def:crs:Epsg::3857'), Epsg.Google);
    assert.equal(Epsg.parse('Epsg:3857'), Epsg.Google);
    assert.equal(Epsg.parse('global--mercator'), Epsg.Google);
    assert.equal(Epsg.parse('global_mercator'), Epsg.Google);

    assert.equal(Epsg.parse('wgs84'), Epsg.Wgs84);
    assert.equal(Epsg.parse('Epsg:4326'), Epsg.Wgs84);
    assert.equal(Epsg.parse('4326'), Epsg.Wgs84);

    assert.equal(Epsg.parse('NZTM_2000'), Epsg.Nztm2000);
    assert.equal(Epsg.parse('nztm'), Epsg.Nztm2000);
    assert.equal(Epsg.parse('Epsg:2193'), Epsg.Nztm2000);
    assert.equal(Epsg.parse('2193'), Epsg.Nztm2000);

    assert.equal(Epsg.parse('citm_2000'), Epsg.Citm2000);
    assert.equal(Epsg.parse('citm'), Epsg.Citm2000);
    assert.equal(Epsg.parse('Epsg:3793'), Epsg.Citm2000);
    assert.equal(Epsg.parse('3793'), Epsg.Citm2000);
  });

  it('should parse urls', () => {
    assert.equal(Epsg.parse('https://www.opengis.net/def/crs/EPSG/0/2193'), Epsg.Nztm2000);
    assert.equal(Epsg.parse('https://www.opengis.net/def/crs/EPSG/0/3857'), Epsg.Google);
    assert.equal(Epsg.parse(Nztm2000Tms.def.supportedCRS), Epsg.Nztm2000);
  });
});

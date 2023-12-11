import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  extractYearRangeFromName,
  extractYearRangeFromTitle,
  getUrlHost,
  s3ToVsis3,
  titleizeImageryName,
} from '../util.js';

describe('util', () => {
  it('extractYearRangeFromName', () => {
    assert.deepEqual(extractYearRangeFromName('2013'), [2013, 2014]);
    assert.deepEqual(extractYearRangeFromName('abc2017def'), [2017, 2018]);
    assert.deepEqual(extractYearRangeFromName('2019_abc'), [2019, 2020]);
    assert.deepEqual(extractYearRangeFromName('12019_abc'), null);
    assert.deepEqual(extractYearRangeFromName('2019_abc2020'), [2019, 2021]);
    assert.deepEqual(extractYearRangeFromName('2020_abc2019'), [2019, 2021]);
    assert.deepEqual(extractYearRangeFromName('2020-23abc'), [2020, 2024]);

    assert.deepEqual(extractYearRangeFromName('wellington_urban_2017_0.10m'), [2017, 2018]);
    assert.deepEqual(extractYearRangeFromName('gebco_2020_305-75m'), [2020, 2021]);
    // FIXME these are currently broken
    // o(extractYearRangeFromName('otago_0_375m_sn3806_1975')).deepEquals([1975, 1976]);
  });

  it('extractYearRangeFromTitle', () => {
    assert.deepEqual(extractYearRangeFromTitle('Banks Peninsula 0.075m Urban Aerial Photos (2019-2020)'), [2019, 2020]);
    assert.deepEqual(extractYearRangeFromTitle('Manawatu 0.125m Urban Aerial Photos (2019)'), [2019]);

    assert.deepEqual(extractYearRangeFromTitle('Manawatu 0.125m Urban Aerial Photos (2019a)'), null);
  });

  it('titleizeImageryName', () => {
    assert.equal(
      titleizeImageryName('palmerston-north_urban_2016-17_12-125m_RGBA'),
      'Palmerston-north urban 2016-17 12.125m RGBA',
    );
    assert.equal(
      titleizeImageryName('palmerston-north_urban_2016-17_12-125_RGBA'),
      'Palmerston-north urban 2016-17 12-125 RGBA',
    );
  });

  it('s3ToVsis3', () => {
    assert.equal(s3ToVsis3('s3://rest/of/path'), '/vsis3/rest/of/path');
    assert.equal(s3ToVsis3('s3:/rest/of/path'), 's3:/rest/of/path');
    assert.equal(s3ToVsis3('/s3://rest/of/path'), '/s3://rest/of/path');
  });

  describe('getUrlHost', () => {
    it("should normalize referer's", () => {
      assert.equal(getUrlHost('https://127.0.0.244/'), '127.0.0.244');
      assert.equal(getUrlHost('https://foo.d/'), 'foo.d');
      assert.equal(getUrlHost('https://foo.d/bar/baz.html?q=1234'), 'foo.d');
      assert.equal(getUrlHost('http://foo.d/bar/baz.html?q=1234'), 'foo.d');
      assert.equal(getUrlHost('http://basemaps.linz.govt.nz/?p=2193'), 'basemaps.linz.govt.nz');
      assert.equal(getUrlHost('s3://foo/bar/baz'), 'foo');
      assert.equal(getUrlHost('http://localhost:12344/bar/baz'), 'localhost');
    });

    it('should normalize www.foo.com and foo.com ', () => {
      assert.equal(getUrlHost('https://www.foo.com/'), 'foo.com');
      assert.equal(getUrlHost('https://bar.foo.com/'), 'bar.foo.com');
      assert.equal(getUrlHost('https://www3.foo.com/'), 'www3.foo.com');
      assert.equal(getUrlHost('https://foo.com/'), 'foo.com');
    });

    it('should not die with badly formatted urls', () => {
      assert.equal(getUrlHost('foo/bar'), 'foo/bar');
      assert.equal(getUrlHost('some weird text'), 'some weird text');
      assert.equal(getUrlHost(undefined), undefined);
    });
  });
});

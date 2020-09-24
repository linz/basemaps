import o from 'ospec';
import { extractYearRangeFromName, getUrlHost, s3ToVsis3, titleizeImageryName } from '../util';

o.spec('util', () => {
    o('extractYearRangeFromName', () => {
        o(extractYearRangeFromName('2013')).deepEquals([2013, 2014]);
        o(extractYearRangeFromName('abc2017def')).deepEquals([2017, 2018]);
        o(extractYearRangeFromName('2019_abc')).deepEquals([2019, 2020]);
        o(extractYearRangeFromName('12019_abc')).deepEquals([-1, -1]);
        o(extractYearRangeFromName('2019_abc2020')).deepEquals([2019, 2021]);
        o(extractYearRangeFromName('2020_abc2019')).deepEquals([2019, 2021]);
        o(extractYearRangeFromName('2020-23abc')).deepEquals([2020, 2024]);
    });

    o('titleizeImageryName', () => {
        o(titleizeImageryName('palmerston-north_urban_2016-17_12-125m_RGBA')).equals(
            'Palmerston-north urban 2016-17 12.125m RGBA',
        );
        o(titleizeImageryName('palmerston-north_urban_2016-17_12-125_RGBA')).equals(
            'Palmerston-north urban 2016-17 12-125 RGBA',
        );
    });

    o('s3ToVsis3', () => {
        o(s3ToVsis3('s3://rest/of/path')).equals('/vsis3/rest/of/path');
        o(s3ToVsis3('s3:/rest/of/path')).equals('s3:/rest/of/path');
        o(s3ToVsis3('/s3://rest/of/path')).equals('/s3://rest/of/path');
    });

    o.spec('getUrlHost', () => {
        o("should normalize referer's", () => {
            o(getUrlHost('https://127.0.0.244/')).equals('127.0.0.244');
            o(getUrlHost('https://foo.d/')).equals('foo.d');
            o(getUrlHost('https://foo.d/bar/baz.html?q=1234')).equals('foo.d');
            o(getUrlHost('http://foo.d/bar/baz.html?q=1234')).equals('foo.d');
            o(getUrlHost('http://basemaps.linz.govt.nz/?p=2193')).equals('basemaps.linz.govt.nz');
            o(getUrlHost('s3://foo/bar/baz')).equals('foo');
            o(getUrlHost('http://localhost:12344/bar/baz')).equals('localhost');
        });

        o('should normalize www.foo.com and foo.com ', () => {
            o(getUrlHost('https://www.foo.com/')).equals('foo.com');
            o(getUrlHost('https://bar.foo.com/')).equals('bar.foo.com');
            o(getUrlHost('https://www3.foo.com/')).equals('www3.foo.com');
            o(getUrlHost('https://foo.com/')).equals('foo.com');
        });

        o('should not die with badly formatted urls', () => {
            o(getUrlHost('foo/bar')).equals('foo/bar');
            o(getUrlHost('some weird text')).equals('some weird text');
            o(getUrlHost(undefined)).equals(undefined);
        });
    });
});

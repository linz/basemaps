import o from 'ospec';
import { extractYearRangeFromName, s3ToVsis3 } from '../util';

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

    o('s3ToVsis3', () => {
        o(s3ToVsis3('s3://rest/of/path')).equals('/vsis3/rest/of/path');
        o(s3ToVsis3('s3:/rest/of/path')).equals('s3:/rest/of/path');
        o(s3ToVsis3('/s3://rest/of/path')).equals('/s3://rest/of/path');
    });
});

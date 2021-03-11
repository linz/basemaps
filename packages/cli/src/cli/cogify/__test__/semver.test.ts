import o from 'ospec';
import { SemVer } from '../semver.util';
o.spec('VersionCompare', () => {
    o.spec('toNumber', () => {
        o('should make correct numbers', () => {
            o(SemVer.toNumber('0.0.1')).equals(1);
            o(SemVer.toNumber('0.1.0')).equals(1024);
            o(SemVer.toNumber('0.1.1')).equals(1025);
            o(SemVer.toNumber('0.1.1023')).equals(2047);
            o(SemVer.toNumber('1.0.0')).equals(1048576);
        });

        o('should not overflow', () => {
            o(SemVer.toNumber('1023.1023.1023') > 0).equals(true);
        });

        o('should support up to three dots', () => {
            o(SemVer.toNumber('')).equals(0);
            o(SemVer.toNumber('1')).equals(1048576);
            o(SemVer.toNumber('1.0')).equals(1048576);
            o(SemVer.toNumber('1.0.0')).equals(1048576);
            o(SemVer.toNumber('2')).equals(2097152);
            o(SemVer.toNumber('')).equals(0);
        });

        o('should be getting bigger', () => {
            o(SemVer.toNumber('1.0.0') > SemVer.toNumber('0.0.0')).equals(true);
            o(SemVer.toNumber('1.0.1') > SemVer.toNumber('1.0.0')).equals(true);
            o(SemVer.toNumber('1.1.1') > SemVer.toNumber('1.1.0')).equals(true);
            o(SemVer.toNumber('2.1.1') > SemVer.toNumber('1.1.0')).equals(true);
        });

        o('should support release candidates', () => {
            o(SemVer.toNumber('0.0.1-rc1')).equals(1);
            o(SemVer.toNumber('1.0.0-rc2')).equals(SemVer.toNumber('1.0.0'));
        });
    });

    o.spec('fromNumber', () => {
        o('should create versions', () => {
            o(SemVer.fromNumber(1)).equals('0.0.1');
            o(SemVer.fromNumber(1023)).equals('0.0.1023');
            o(SemVer.fromNumber(1024)).equals('0.1.0');
            o(SemVer.fromNumber(1025)).equals('0.1.1');
            o(SemVer.fromNumber(1048576)).equals('1.0.0');
            o(SemVer.fromNumber(2097152)).equals('2.0.0');
        });

        o('should round trip', () => {
            for (const num of ['0.1.0', '1.2.3', '3.2.1']) {
                o(SemVer.fromNumber(SemVer.toNumber(num))).equals(num)(`Should roundtrip ${num}`);
            }
        });
    });

    o.spec('compare', () => {
        o('should compare versions', () => {
            o(SemVer.compare('0.0.0', '0.0.1')).equals(-1);
            o(SemVer.compare('0.0.1', '0.0.0')).equals(1);
            o(SemVer.compare('0.0.0', '0.0.0')).equals(0);
        });

        o('should sort versions', () => {
            const versions = ['1.0.0', '2.0.0', '0.0.1', '1.2.3'];
            versions.sort(SemVer.compare);
            o(versions).deepEquals(['0.0.1', '1.0.0', '1.2.3', '2.0.0']);
        });
    });
});

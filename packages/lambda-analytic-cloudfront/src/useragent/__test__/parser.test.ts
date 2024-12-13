import assert from 'node:assert';
import { describe, it } from 'node:test';

import { UaParser } from '../agent.js';

describe('UserAgents', () => {
  it('should parse common browsers', () => {
    assert.deepEqual(
      UaParser.parse(
        'Mozilla/5.0%20(X11;%20Linux%20x86_64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/85.0.4183.101%20Safari/537.36',
      ),
      { name: 'chrome', os: 'linux', variant: 'unknown', version: '85' },
    );
    assert.deepEqual(
      UaParser.parse(
        `Mozilla/5.0 (Linux; U; Android 2.2.1; de-de; LG-P350 Build/FRG83) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1 MMS/LG-Android-MMS-V1.0/1.2`,
      ),
      { name: 'androidbrowser', os: 'android', variant: 'unknown', version: '4' },
    );
    assert.deepEqual(
      UaParser.parse('Mozilla/5.0%20(Windows%20NT%2010.0;%20WOW64;%20rv:48.0)%20Gecko/20100101%20Firefox/48.0'),
      { name: 'firefox', os: 'unknown', variant: 'unknown', version: '48' },
    );
    assert.deepEqual(
      UaParser.parse(
        'Mozilla/5.0%20(Linux;%20Android%2011;%20SM-A025F)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/96.0.4664.104%20Mobile%20Safari/537.36',
      ),
      { name: 'chrome', os: 'android', variant: 'unknown', version: '96' },
    );

    assert.deepEqual(
      UaParser.parse(
        'Mozilla/5.0%20(Windows%20NT%2010.0;%20Win64;%20x64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/98.0.4758.80%20Safari/537.36%20Edg/98.0.1108.43',
      ),
      { name: 'edge', os: 'unknown', variant: 'unknown', version: '98' },
    );
  });

  it('should parse qgis', () => {
    assert.deepEqual(UaParser.parse('QGIS/31613'), {
      name: 'qgis',
      version: '3.16',
      os: 'unknown',
      variant: 'unknown',
    });
    assert.deepEqual(UaParser.parse('Mozilla/5.0%20QGIS/31006'), {
      name: 'qgis',
      version: '3.10',
      os: 'unknown',
      variant: 'unknown',
    });
    assert.deepEqual(UaParser.parse('Mozilla/5.0%20QGIS/31607'), {
      name: 'qgis',
      version: '3.16',
      os: 'unknown',
      variant: 'unknown',
    });
    assert.deepEqual(UaParser.parse('Mozilla/5.0%20QGIS/32402/macOS%2012.4'), {
      name: 'qgis',
      version: '3.24',
      os: 'macos',
      variant: 'unknown',
    });
    assert.deepEqual(UaParser.parse('Mozilla/5.0%20QGIS/2.14.9-Essen'), {
      name: 'qgis',
      version: '2.14',
      os: 'unknown',
      variant: 'unknown',
    });
    assert.deepEqual(UaParser.parse('Mozilla/5.0%20QGIS/32601/Windows%2010%20Version%202009'), {
      name: 'qgis',
      version: '3.26',
      os: 'windows',
      variant: 'unknown',
    });
    assert.deepEqual(UaParser.parse('Mozilla/5.0%20QGIS/3.10.1-A%20Coru%C3%B1a'), {
      name: 'qgis',
      version: '3.10',
      os: 'unknown',
      variant: 'unknown',
    });
  });

  it('should parse ArcGIS', () => {
    assert.deepEqual(UaParser.parse('ArcGIS%20Pro%202.7.3%20(00000000000)%20-%20ArcGISPro'), {
      name: 'arcgis',
      os: 'windows',
      variant: 'pro',
      version: '2.7',
    });
    assert.deepEqual(UaParser.parse('ArcGIS%20Pro%203.0.0%20(00000000000)%20-%20ArcGISPro'), {
      name: 'arcgis',
      os: 'windows',
      variant: 'pro',
      version: '3.0',
    });
    assert.deepEqual(UaParser.parse('ArcGIS%20Pro%202.9.3%20(00000000000)%20-%20ArcGISPro'), {
      name: 'arcgis',
      os: 'windows',
      variant: 'pro',
      version: '2.9',
    });
    assert.deepEqual(UaParser.parse('ArcGIS%20Pro%202.9.2%20(00000000000)%20-%20ArcGISPro'), {
      name: 'arcgis',
      os: 'windows',
      variant: 'pro',
      version: '2.9',
    });
    assert.deepEqual(UaParser.parse('ArcGIS%20Pro%202.8.0%20(00000000000)%20-%20ArcGISPro'), {
      name: 'arcgis',
      os: 'windows',
      variant: 'pro',
      version: '2.8',
    });
  });

  it('should handle software', () => {
    assert.deepEqual(UaParser.parse('python-requests/2.23.0'), {
      name: 'python',
      os: 'unknown',
      variant: 'requests',
      version: '2.23.0',
    });
    assert.deepEqual(UaParser.parse('MapProxy-1.12.0'), {
      name: 'map-proxy',
      os: 'unknown',
      variant: 'unknown',
      version: '1.12',
    });
    assert.deepEqual(UaParser.parse('MapProxy-1.13.2'), {
      name: 'map-proxy',
      os: 'unknown',
      variant: 'unknown',
      version: '1.13',
    });
    assert.deepEqual(UaParser.parse('okhttp/3.12.3'), {
      name: 'okhttp',
      os: 'unknown',
      variant: 'unknown',
      version: '3.12',
    });
    assert.deepEqual(UaParser.parse('axios/0.21.1'), {
      name: 'axios',
      os: 'unknown',
      variant: 'unknown',
      version: '0.21',
    });
    assert.deepEqual(UaParser.parse('Dart/2.16 (dart:io) '), {
      name: 'dart',
      os: 'unknown',
      variant: 'unknown',
      version: '2.16',
    });
    assert.deepEqual(UaParser.parse('Apache-HttpClient/4.5.13'), {
      name: 'apache',
      os: 'unknown',
      variant: 'http',
      version: '4.5',
    });
  });

  it('should parse gis software', () => {
    // assert.deepEqual(
    //   UaParser.parse('MapFishPrint/3.29.2%20Apache-HttpClient/4.5.13%20(Java/1.8.0_312)'),
    //   'mapfishprint_3.29',
    // );
    assert.deepEqual(
      UaParser.parse(
        'FME/2022.7.43.22343%20%20libcurl/7.79.1%20(OpenSSL/1.1.1n)%20Schannel%20zlib/1.2.11%20WinIDN%20libssh2/1.10.0%20nghttp2/1.44.0',
      ),
      { name: 'fme', os: 'unknown', variant: 'unknown', version: '2022.7' },
    );

    assert.deepEqual(UaParser.parse('JOSM/1.5 (18513 en) Windows 10 64-Bit Java/11.0.15'), {
      name: 'josm',
      os: 'unknown',
      variant: 'unknown',
      version: '1.5',
    });

    assert.deepEqual(UaParser.parse('GDAL WMS driver (http://www.gdal.org/frmt_wms.html)'), {
      name: 'gdal',
      os: 'unknown',
      variant: 'wms',
      version: 'unknown',
    });

    assert.deepEqual(UaParser.parse('MapInfoPro/21.0.0.0172 (MapInfoPro.exe) '), {
      name: 'unknown',
      os: 'unknown',
      variant: 'unknown',
      version: 'unknown',
    });
  });
});

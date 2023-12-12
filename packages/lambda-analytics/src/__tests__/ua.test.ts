import assert from 'node:assert';
import { describe, it } from 'node:test';

import { getUserAgent } from '../ua.js';

describe('UserAgent', () => {
  it('should parse most browsers', () => {
    assert.equal(
      getUserAgent(
        'Mozilla/5.0%20(X11;%20Linux%20x86_64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/85.0.4183.101%20Safari/537.36',
      ),
      'chrome_85',
    );
    assert.equal(
      getUserAgent(
        `Mozilla/5.0 (Linux; U; Android 2.2.1; de-de; LG-P350 Build/FRG83) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1 MMS/LG-Android-MMS-V1.0/1.2`,
      ),
      'androidbrowser_4',
    );
    assert.equal(
      getUserAgent('Mozilla/5.0%20(Windows%20NT%2010.0;%20WOW64;%20rv:48.0)%20Gecko/20100101%20Firefox/48.0'),
      'firefox_48',
    );
    assert.equal(
      getUserAgent(
        'Mozilla/5.0%20(Linux;%20Android%2011;%20SM-A025F)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/96.0.4664.104%20Mobile%20Safari/537.36',
      ),
      'chrome_96',
    );

    assert.equal(
      getUserAgent(
        'Mozilla/5.0%20(Windows%20NT%2010.0;%20Win64;%20x64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/98.0.4758.80%20Safari/537.36%20Edg/98.0.1108.43',
      ),
      'edge_98',
    );
  });

  it('should parse qgis', () => {
    assert.equal(getUserAgent('QGIS/31613'), 'qgis_3.16');
    assert.equal(getUserAgent('Mozilla/5.0%20QGIS/31006'), 'qgis_3.10');
    assert.equal(getUserAgent('Mozilla/5.0%20QGIS/31607'), 'qgis_3.16');
    assert.equal(getUserAgent('Mozilla/5.0%20QGIS/32402/macOS%2012.4'), 'qgis_3.24');
    assert.equal(getUserAgent('Mozilla/5.0%20QGIS/2.14.9-Essen'), 'qgis_2.14');
    assert.equal(getUserAgent('Mozilla/5.0%20QGIS/32601/Windows%2010%20Version%202009'), 'qgis_3.26');
    assert.equal(getUserAgent('Mozilla/5.0%20QGIS/3.10.1-A%20Coru%C3%B1a'), 'qgis_3.10');
  });

  it('should parse arcgis runtime', () => {
    assert.equal(
      getUserAgent(
        'ArcGISRuntime-NET/100.11.2%20(Windows%2010.0.18363;%20Win64;%20WOW64;%20UAP;%20Windows.Desktop)%20Esri.4378442FBC3A7/21.0.2',
      ),
      'arcgis-net_100',
    );
    assert.equal(
      getUserAgent('ArcGISRuntime-Qt/100.10%20(iOS%2015.6;%20arm64;%20Qt%205.15.2;%20AppStudio%205.0.148)'),
      'arcgis-qt_100',
    );
    assert.equal(
      getUserAgent('ArcGISRuntime-NET/100.4%20(Windows%2010.0.17134;%20Win64;%20WOW64;%20.NET%204.7.2+)'),
      'arcgis-net_100',
    );

    assert.equal(
      getUserAgent('ArcGISRuntime-Qt/100.10%20(Android%2011.0;%20arm64;%20Qt%205.15.2;%20AppStudio%205.0.148)'),
      'arcgis-qt_100',
    );
    assert.equal(
      getUserAgent('ArcGISRuntime-Android/100.13%20(Android%209.0;%20arm64-v8a;%20SAMSUNG-SM-A530F)'),
      'arcgis-android_100',
    );
    assert.equal(
      getUserAgent(
        'ArcGISRuntime-iOS/100.14.1%20(iOS%2015.5;%20iPhone12,1)%20com.crittermap.backcountrynavigator.xe/0.6.19',
      ),
      'arcgis-ios_100',
    );
  });

  it('should parse arcgis pro', () => {
    assert.equal(getUserAgent('ArcGIS%20Pro%202.7.3%20(00000000000)%20-%20ArcGISPro'), 'arcgis-pro_2.7');
    assert.equal(getUserAgent('ArcGIS%20Pro%203.0.0%20(00000000000)%20-%20ArcGISPro'), 'arcgis-pro_3.0');
    assert.equal(getUserAgent('ArcGIS%20Pro%202.9.3%20(00000000000)%20-%20ArcGISPro'), 'arcgis-pro_2.9');
    assert.equal(getUserAgent('ArcGIS%20Pro%202.9.2%20(00000000000)%20-%20ArcGISPro'), 'arcgis-pro_2.9');
    assert.equal(getUserAgent('ArcGIS%20Pro%202.8.0%20(00000000000)%20-%20ArcGISPro'), 'arcgis-pro_2.8');
  });

  it('should decode double encoded', () => {
    assert.equal(getUserAgent('Tracks%2520NZ/1%20CFNetwork/1335.0.3%20Darwin/21.6.0'), 'ios_tracksnz');
  });

  it('should parse, random gis software', () => {
    assert.equal(
      getUserAgent('MapFishPrint/3.29.2%20Apache-HttpClient/4.5.13%20(Java/1.8.0_312)'),
      'mapfishprint_3.29',
    );
    assert.equal(
      getUserAgent(
        'FME/2022.7.43.22343%20%20libcurl/7.79.1%20(OpenSSL/1.1.1n)%20Schannel%20zlib/1.2.11%20WinIDN%20libssh2/1.10.0%20nghttp2/1.44.0',
      ),
      'fme_2022.7',
    );

    assert.equal(getUserAgent('JOSM/1.5 (18513 en) Windows 10 64-Bit Java/11.0.15'), 'josm_1.5');

    assert.equal(getUserAgent('GDAL WMS driver (http://www.gdal.org/frmt_wms.html)'), 'gdal_wms');

    assert.equal(getUserAgent('MapInfoPro/21.0.0.0172 (MapInfoPro.exe) '), 'map-info-pro_21');
  });

  it('should handle software', () => {
    assert.equal(getUserAgent('python-requests/2.23.0'), 'python-requests_2.23');
    assert.equal(getUserAgent('MapProxy-1.12.0'), 'map-proxy_1.12');
    assert.equal(getUserAgent('MapProxy-1.13.2'), 'map-proxy_1.13');
    assert.equal(getUserAgent('okhttp/3.12.3'), 'okhttp_3.12');
    assert.equal(getUserAgent('axios/0.21.1'), 'axios_0.21');
    assert.equal(getUserAgent('Dart/2.16 (dart:io) '), 'dart_2.16');
    assert.equal(getUserAgent('Apache-HttpClient/4.5.13'), 'apache-http_4.5');
  });
});

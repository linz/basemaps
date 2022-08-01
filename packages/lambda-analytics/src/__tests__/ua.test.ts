import o from 'ospec';
import { getUserAgent } from '../ua.js';

o.spec('UserAgent', () => {
  o('should parse most browsers', () => {
    o(
      getUserAgent(
        'Mozilla/5.0%20(X11;%20Linux%20x86_64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/85.0.4183.101%20Safari/537.36',
      ),
    ).equals('chrome_85');
    o(
      getUserAgent(
        `Mozilla/5.0 (Linux; U; Android 2.2.1; de-de; LG-P350 Build/FRG83) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1 MMS/LG-Android-MMS-V1.0/1.2`,
      ),
    ).equals('androidbrowser_4');
    o(getUserAgent('Mozilla/5.0%20(Windows%20NT%2010.0;%20WOW64;%20rv:48.0)%20Gecko/20100101%20Firefox/48.0')).equals(
      'firefox_48',
    );
    o(
      getUserAgent(
        'Mozilla/5.0%20(Linux;%20Android%2011;%20SM-A025F)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/96.0.4664.104%20Mobile%20Safari/537.36',
      ),
    ).equals('chrome_96');

    o(
      getUserAgent(
        'Mozilla/5.0%20(Windows%20NT%2010.0;%20Win64;%20x64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/98.0.4758.80%20Safari/537.36%20Edg/98.0.1108.43',
      ),
    ).equals('edge_98');
  });

  o('should parse qgis', () => {
    o(getUserAgent('QGIS/31613')).equals('qgis_3.16');
    o(getUserAgent('Mozilla/5.0%20QGIS/31006')).equals('qgis_3.10');
    o(getUserAgent('Mozilla/5.0%20QGIS/31607')).equals('qgis_3.16');
    o(getUserAgent('Mozilla/5.0%20QGIS/32402/macOS%2012.4')).equals('qgis_3.24');
    o(getUserAgent('Mozilla/5.0%20QGIS/2.14.9-Essen')).equals('qgis_2.14');
    o(getUserAgent('Mozilla/5.0%20QGIS/32601/Windows%2010%20Version%202009')).equals('qgis_3.26');
    o(getUserAgent('Mozilla/5.0%20QGIS/3.10.1-A%20Coru%C3%B1a')).equals('qgis_3.10');
  });

  o('should parse arcgis runtime', () => {
    o(
      getUserAgent(
        'ArcGISRuntime-NET/100.11.2%20(Windows%2010.0.18363;%20Win64;%20WOW64;%20UAP;%20Windows.Desktop)%20Esri.4378442FBC3A7/21.0.2',
      ),
    ).equals('arcgis_net_100');
    o(getUserAgent('ArcGISRuntime-Qt/100.10%20(iOS%2015.6;%20arm64;%20Qt%205.15.2;%20AppStudio%205.0.148)')).equals(
      'arcgis_qt_100',
    );
    o(getUserAgent('ArcGISRuntime-NET/100.4%20(Windows%2010.0.17134;%20Win64;%20WOW64;%20.NET%204.7.2+)')).equals(
      'arcgis_net_100',
    );

    o(getUserAgent('ArcGISRuntime-Qt/100.10%20(Android%2011.0;%20arm64;%20Qt%205.15.2;%20AppStudio%205.0.148)')).equals(
      'arcgis_qt_100',
    );
    o(getUserAgent('ArcGISRuntime-Android/100.13%20(Android%209.0;%20arm64-v8a;%20SAMSUNG-SM-A530F)')).equals(
      'arcgis_android_100',
    );
    o(
      getUserAgent(
        'ArcGISRuntime-iOS/100.14.1%20(iOS%2015.5;%20iPhone12,1)%20com.crittermap.backcountrynavigator.xe/0.6.19',
      ),
    ).equals('arcgis_ios_100');
  });

  o('should parse arcgis pro', () => {
    o(getUserAgent('ArcGIS%20Pro%202.7.3%20(00000000000)%20-%20ArcGISPro')).equals('arcgis_pro_2.7');
    o(getUserAgent('ArcGIS%20Pro%203.0.0%20(00000000000)%20-%20ArcGISPro')).equals('arcgis_pro_3.0');
    o(getUserAgent('ArcGIS%20Pro%202.9.3%20(00000000000)%20-%20ArcGISPro')).equals('arcgis_pro_2.9');
    o(getUserAgent('ArcGIS%20Pro%202.9.2%20(00000000000)%20-%20ArcGISPro')).equals('arcgis_pro_2.9');
    o(getUserAgent('ArcGIS%20Pro%202.8.0%20(00000000000)%20-%20ArcGISPro')).equals('arcgis_pro_2.8');
  });

  o('should decode double encoded', () => {
    o(getUserAgent('Tracks%2520NZ/1%20CFNetwork/1335.0.3%20Darwin/21.6.0')).equals('ios_tracksnz');
  });

  o('should parse, random gis software', () => {
    o(getUserAgent('MapFishPrint/3.29.2%20Apache-HttpClient/4.5.13%20(Java/1.8.0_312)')).equals('mapfishprint_3.29');
    o(
      getUserAgent(
        'FME/2022.7.43.22343%20%20libcurl/7.79.1%20(OpenSSL/1.1.1n)%20Schannel%20zlib/1.2.11%20WinIDN%20libssh2/1.10.0%20nghttp2/1.44.0',
      ),
    ).equals('fme_2022.7');

    o(getUserAgent('JOSM/1.5 (18513 en) Windows 10 64-Bit Java/11.0.15')).equals('josm_1.5');

    o(getUserAgent('GDAL WMS driver (http://www.gdal.org/frmt_wms.html)')).equals('gdal_wms');

    o(getUserAgent('MapInfoPro/21.0.0.0172 (MapInfoPro.exe) ')).equals('mapinfopro_21');
  });

  o('should handle software', () => {
    o(getUserAgent('python-requests/2.23.0')).equals('python_requests_2.23');
    o(getUserAgent('MapProxy-1.12.0')).equals('mapproxy_1.12');
    o(getUserAgent('MapProxy-1.13.2')).equals('mapproxy_1.13');
    o(getUserAgent('okhttp/3.12.3')).equals('okhttp_3.12');
    o(getUserAgent('axios/0.21.1')).equals('axios_0.21');
    o(getUserAgent('Dart/2.16 (dart:io) ')).equals('dart_2.16');
    o(getUserAgent('Apache-HttpClient/4.5.13')).equals('apache_http_4.5');
  });
});

import UA from 'ua-parser-js';

/** Guess if a useragent is a robot */
function isBot(userAgent: string): string | void {
  if (userAgent.startsWith('Googlebot-')) return 'bot_google';
  if (userAgent.includes('Googlebot')) return 'bot_google';
  if (userAgent.includes('Discordbot')) return 'bot_discord';
  if (userAgent.includes('bingbot')) return 'bot_bing';
  if (userAgent.includes('UptimeRobot/')) return 'bot_uptime_robot';
  if (userAgent.includes('/bot.html')) return 'bot_unknown';
}

function isSoftware(userAgent: string): string | void {
  if (userAgent.startsWith('python-requests/')) {
    return 'python_requests_' + userAgent.slice('python-requests/'.length, userAgent.lastIndexOf('.'));
  }
  if (userAgent.startsWith('Python-urllib/')) return 'python_urllib_' + userAgent.replace('python-urllib/', '');
  if (userAgent.startsWith('axios/')) return userAgent.slice(0, userAgent.lastIndexOf('.')).replace('/', '_');
  if (userAgent.startsWith('okhttp/')) return userAgent.slice(0, userAgent.lastIndexOf('.')).replace('/', '_');
  if (userAgent.startsWith('Go-http-client/')) return userAgent.replace('Go-http-client/', 'go_http_');
  if (userAgent.startsWith('Dart/')) return userAgent.split(' ')[0].replace('Dart/', 'dart_');
  if (userAgent.startsWith('Apache-HttpClient/')) {
    return userAgent.slice(0, userAgent.lastIndexOf('.')).replace('Apache-HttpClient/', 'apache_http_');
  }
}

function isGis(userAgent: string): string | void {
  /** QGIS  */
  if (userAgent.startsWith('Mozilla/5.0 QGIS/')) {
    const chunk = userAgent.replace('Mozilla/5.0 QGIS/', '').split('/')[0];
    if (chunk == null) return 'qgis_unknown';
    // Mozilla/5.0 QGIS/2.18.22
    // Mozilla/5.0 QGIS/2.14.9-Essen
    if (chunk.includes('.')) return `qgis_` + chunk.slice(0, chunk.lastIndexOf('.'));

    // Mozilla/5.0 QGIS/31400
    // Mozilla/5.0 QGIS/32400/Windows 10 Version 2009
    const qgisVersion = Number(chunk);
    if (isNaN(qgisVersion)) return 'qgis_unknown';
    return `qgis_${(qgisVersion / 10000).toFixed(2)}`;
  }

  if (userAgent.startsWith('QGIS/')) {
    const qgisVersion = Number(userAgent.split('/')[1]);
    if (isNaN(qgisVersion)) return 'qgis_unknown';
    return `qgis_${(qgisVersion / 10000).toFixed(2)}`;
  }

  /** Arc GIS */
  // ArcGISRuntime-NET/100.11.2 ...
  // ArcGISRuntime-Qt/100.10 ...
  if (userAgent.startsWith('ArcGISRuntime-')) {
    const chunks = userAgent.split('/');
    const variant = chunks[0].replace('ArcGISRuntime-', '').toLowerCase();
    const version = chunks[1].slice(0, chunks[1].indexOf('.'));
    return 'arcgis_' + variant + '_' + version;
  }

  if (userAgent.startsWith('ArcGIS Client')) return 'arcgis_client';
  // ArcGIS Pro 2.7.3 (00000000000) - ArcGISPro
  // ArcGIS Pro 3.0.0 (00000000000) - ArcGISPro
  if (userAgent.startsWith('ArcGIS Pro')) {
    return 'arcgis_pro_' + userAgent.slice('ArcGIS Pro'.length, userAgent.lastIndexOf('.')).trim();
  }

  // MapFishPrint/3.29.2 Apache-HttpClient/4.5.13 (Java/1.8.0_312)
  if (userAgent.startsWith('MapFishPrint')) {
    return 'mapfishprint_' + userAgent.slice('MapFishPrint/'.length, userAgent.indexOf(' ') - 2);
  }

  //MapProxy-1.12.0
  if (userAgent.startsWith('MapProxy-')) {
    return userAgent.slice(0, userAgent.lastIndexOf('.')).replace('MapProxy-', 'mapproxy_');
  }

  // FME/2022.7.43.22343  libcurl/7.79.1 (OpenSSL/1.1.1n) Schannel zlib/1.2.11 WinIDN libssh2/1.10.0 nghttp2/1.44.0
  if (userAgent.startsWith('FME/')) return userAgent.slice(0, userAgent.indexOf('.', 9)).replace('FME/', 'fme_');

  // JOSM/1.5 (18513 en) Windows 10 64-Bit Java/11.0.15
  if (userAgent.startsWith('JOSM')) return userAgent.slice(0, userAgent.indexOf(' ')).replace('JOSM/', 'josm_');

  // GDAL WMS driver (http://www.gdal.org/frmt_wms.html)
  if (userAgent.startsWith('GDAL WMS')) return 'gdal_wms';

  // MapInfoPro/21.0.0.0172 (MapInfoPro.exe)
  if (userAgent.startsWith('MapInfoPro/')) {
    return userAgent.slice(0, userAgent.indexOf('.')).replace('MapInfoPro/', 'mapinfopro_');
  }
}

function parseUserAgent(userAgent: string): string {
  const parsedName = decodeURI(userAgent);
  const botName = isBot(parsedName);
  if (botName) return botName;

  const gisName = isGis(parsedName);
  if (gisName) return gisName;

  const softwareName = isSoftware(parsedName);
  if (softwareName) return softwareName;

  const ua = UA(userAgent);

  const browserNames = [];
  // TODO do we care about os name
  // if (ua.os.name) browserNames.push(ua.os.name);
  if (ua.browser.name) {
    browserNames.push(ua.browser.name.replace(/ /g, ''));
    if (ua.browser.version) browserNames.push(ua.browser.version.slice(0, ua.browser.version.indexOf('.')));
    return browserNames.join('_').toLowerCase();
  }

  // Android applications
  // com.hougarden.house/4.2.3 (4230) Mapbox/9.7.1 (545884a) Android/29 (arm64-v8a)'
  if (ua.os.name === 'Android') {
    if (parsedName.includes('/')) return `android_${parsedName.slice(0, parsedName.indexOf('/')).toLowerCase()}`;
  }

  // IOS apps
  // Tracks%2520NZ/1 CFNetwork/1335.0.3 Darwin/21.6.0'
  if (ua.os.name === 'iOS' || parsedName.includes('iOS/') || parsedName.includes('iPad/')) {
    if (parsedName.includes('/')) return `ios_${parsedName.slice(0, parsedName.indexOf('/')).toLowerCase()}`;
  }

  // Unknown user agent
  return 'unknown';
}

const IgnoreUserAgents = new Set(['Mozilla/5.0']);

export function getUserAgent(userAgent: string): string {
  if (userAgent == null || userAgent === '-' || IgnoreUserAgents.has(userAgent)) return 'empty';

  const ret = parseUserAgent(userAgent);
  // Some user agents are double encoded
  if (ret.includes('%')) return decodeURI(ret).replace(/ /g, '');
  return ret;
}

import UA from 'ua-parser-js';

/** Guess if a useragent is a robot */
function isBot(userAgent: string): string | undefined {
  if (userAgent.startsWith('Googlebot-')) return 'bot_google';
  if (userAgent.includes('Googlebot')) return 'bot_google';
  if (userAgent.includes('Discordbot')) return 'bot_discord';
  if (userAgent.includes('bingbot')) return 'bot_bing';
  if (userAgent.includes('/bot.html')) return 'bot_unknown';
  return;
}

function isGis(userAgent: string): string | undefined {
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
  return;
}

function parseUserAgent(userAgent: string): string {
  const parsedName = decodeURI(userAgent);
  const botName = isBot(parsedName);
  if (botName) return botName;

  const gisName = isGis(parsedName);
  if (gisName) return gisName;

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
  // com.hougarden.house/4.2.3%20(4230)%20Mapbox/9.7.1%20(545884a)%20Android/29%20(arm64-v8a)'
  if (ua.os.name === 'Android') {
    if (parsedName.includes('/')) return `android_${parsedName.slice(0, parsedName.indexOf('/')).toLowerCase()}`;
  }

  // IOS apps
  // Tracks%2520NZ/1%20CFNetwork/1335.0.3%20Darwin/21.6.0'
  if (ua.os.name === 'iOS' || parsedName.includes('iOS/') || parsedName.includes('iPad/')) {
    if (parsedName.includes('/')) return `ios_${parsedName.slice(0, parsedName.indexOf('/')).toLowerCase()}`;
  }

  // Unknown user agent
  return 'unknown';
}

export function getUserAgent(userAgent: string): string {
  if (userAgent == null || userAgent === '-') return 'empty';

  const ret = parseUserAgent(userAgent);
  // Some user agents are double encoded
  if (ret.includes('%20')) return ret.replace(/%20/g, '');
  return ret;
}

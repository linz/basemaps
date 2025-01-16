import { isValidOs, UserAgentOs, UserAgentParser } from '../parser.types.js';

// Mozilla/5.0 QGIS/32400/Windows 10 Version 2009
function guessQgisOs(ua: string): UserAgentOs | undefined {
  if (ua.includes('/windows')) return 'windows';
  if (ua.includes('/mac')) return 'macos';
  return;
}

const ArcGis: Record<string, UserAgentParser> = {
  // ArcGISRuntime-NET/100.11.2 (Windows.....
  // ArcGISRuntime-Qt/100.10 ...
  'ArcGISRuntime-': (ua: string) => {
    const chunks = ua.split('/');
    const variant = chunks[0].slice('ArcGISRuntime-'.length).toLowerCase();
    const version = chunks[1].slice(0, chunks[1].indexOf('.'));
    const os = chunks[1].split(' ')[1].slice(1);
    if (isValidOs(os)) return { name: 'arcgis', variant, version, os };
    return { name: 'arcgis', variant, version };
  },

  // ArcGIS Pro 2.7.3 (00000000000) - ArcGISPro
  // ArcGIS Pro 3.0.0 (00000000000) - ArcGISPro
  'ArcGIS Pro': (ua: string) => {
    return {
      name: 'arcgis',
      variant: 'pro',
      version: ua.slice('ArcGIS Pro'.length, ua.lastIndexOf('.')).trim(),
      os: 'windows',
    }; // assume arcgis is windows
  },

  'ArcGIS Client': () => {
    return { name: 'arcgis', variant: 'client' };
  },
};

function guessJosmOs(ua: string): { os: 'linux' } | undefined {
  if (ua.includes('linux')) return { os: 'linux' };
  return;
}

export const Gis: Record<string, UserAgentParser> = {
  ...ArcGis,
  // QGIS/31613
  'QGIS/': (ua) => {
    const qgisVersion = Number(ua.split('/')[1]);
    if (isNaN(qgisVersion)) return { name: 'qgis', os: guessQgisOs(ua) };
    return { name: 'qgis', version: (qgisVersion / 10000).toFixed(2), os: guessQgisOs(ua) };
  },
  'Mozilla/5.0 QGIS/': (ua) => {
    const chunk = ua.slice('Mozilla/5.0 QGIS/'.length).split('/')[0];
    if (chunk == null) return { name: 'qgis', os: guessQgisOs(ua) };
    // Mozilla/5.0 QGIS/2.18.22
    // Mozilla/5.0 QGIS/2.14.9-Essen
    if (chunk.includes('.'))
      return { name: 'qgis', version: chunk.slice(0, chunk.lastIndexOf('.')), os: guessQgisOs(ua) };

    // Mozilla/5.0 QGIS/31400
    // Mozilla/5.0 QGIS/32400/Windows 10 Version 2009
    const qgisVersion = Number(chunk);
    if (isNaN(qgisVersion)) return { name: 'qgis', os: guessQgisOs(ua) };
    return { name: 'qgis', version: `${(qgisVersion / 10000).toFixed(2)}`, os: guessQgisOs(ua) };
  },

  // FME/2022.7.43.22343  libcurl/7.79.1 (OpenSSL/1.1.1n) Schannel zlib/1.2.11 WinIDN libssh2/1.10.0 nghttp2/1.44.0
  'FME/': (ua) => {
    return { name: 'fme', version: ua.slice('FME/'.length, ua.indexOf('.', 9)) };
  },

  // GDAL WMS driver (http://www.gdal.org/frmt_wms.html)
  'GDAL WMS': () => {
    return { name: 'gdal', variant: 'wms' };
  },

  // MapProxy-1.12.0
  'MapProxy-': (ua) => {
    return { name: 'map-proxy', version: ua.slice('MapProxy-'.length, ua.lastIndexOf('.')) };
  },

  // JOSM/1.5 (18700 en) Linux Freedesktop.org SDK 22.08 (Flatpak runtime) Java/17.0.6 29147
  // JOSM/1.5 (18700 en) Linux Mint 20.3 Java/17.0.5
  'JOSM/': (ua) => {
    return { name: 'josm', version: ua.slice('JOSM/'.length, ua.indexOf(' ')), ...guessJosmOs(ua) };
  },
};

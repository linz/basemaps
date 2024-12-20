import { createInterface } from 'node:readline/promises';
import { createGunzip } from 'node:zlib';

import { sha256base58 } from '@basemaps/config';
import { fsa } from '@chunkd/fs';

import { LogStats } from './log.stats.js';
import { parseQueryString } from './log/query.js';
import { getUrlHost } from './log/referer.js';
import { parseTileUrl } from './log/tile.url.js';
import { UaParser } from './useragent/agent.js';

/**
00 'date': '2017-02-09',
01 'time': '17:50:17',
02 'x-edge-location': 'MUC51',
03 'sc-bytes': '2797', // Number of bytes to viewer
04 'c-ip': '192.168.0.123', 
05 'cs-method': 'GET',
06 'cs-host': 'yourdistribution.cloudfront.net',
07 'cs-uri-stem': '/',
08 'sc-status': '200',
09 'cs-referer': '-',
10 'cs-user-agent': 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
11 'cs-uri-query': '-',
12 'cs-cookie': '-',
13 'x-edge-result-type': 'Hit',
14 'x-edge-request-id': 'sjXpb8nMq_1ewovZ6nrojpvxIETPbo7EhF2RNtPZ_zfd0MtOW6pjlg==',
15 'x-host-header': 'example.com',
16 'cs-protocol': 'https',
17 'cs-bytes': '148',
18 'time-taken': '0.002',
19 'x-forwarded-for': '-',
20 'ssl-protocol': 'TLSv1.2',
21 'ssl-cipher': 'ECDHE-RSA-AES128-GCM-SHA256',
22 'x-edge-response-result-type': 'Hit',
23 'cs-protocol-version': 'HTTP/1.1' 
*/

// tiles with full alpha or single solid color are approx these size
const EmptyTileSizes: Record<string, number> = {
  webp: 214,
  png: 355,
  jpeg: 650,
};

const IsoDateMonth = 7; // 2023-06
const IsoDateDay = 10; // 2023-06-12
const IsoDateHour = 13; // 2023-06-12:T01

/**
 * Hide the full API key from the log analytics
 */
function hideApiKey(str: string): string {
  if (str.startsWith('d')) return 'd' + str.slice(str.length - 6);
  if (str.startsWith('c')) return 'c' + str.slice(str.length - 6);
  return str;
}

const empty: Record<string, number> = { webp: 0, png: 0, jpeg: 0 };
export function toFullDate(x: string): string {
  if (x.length === IsoDateMonth) return `${x}-01T00:00:00.000Z`;
  if (x.length === IsoDateDay) return `${x}T00:00:00.000Z`;
  if (x.length === IsoDateHour) return `${x}:00:00.000Z`;
  throw new Error('Unknown date:' + x);
}

export const FileProcess = {
  process(fileName: URL, stats: Map<string, LogStats>): Promise<number> {
    let count = 0;
    const lineReader = createInterface({ input: fsa.readStream(fileName).pipe(createGunzip()), terminal: false });

    function processLine(line: string): void {
      if (line.startsWith('#')) return;
      const lineData = line.split('\t');
      const status = Number(lineData[8]);

      // Ignore requests that were not actually served
      if (status > 399) return;
      if (status < 200) return;
      // No data was served ignore!
      if (status === 204) return;

      // Ignore files where no bytes were served
      const bytes = Number(lineData[3]);
      if (isNaN(bytes)) return;

      // Ignore anything that is not /v1/tiles
      const url = lineData[7];
      if (!url.startsWith('/v1/tiles')) return;

      const date = lineData[0];
      const time = lineData[1];
      const dateTime = `${date}T${time}Z`;

      const contentLength = Number(lineData[30]);

      const { api, pipeline } = parseQueryString(lineData[11]);

      // Slice the request to the hour 2023-06-12T01
      const dateAggregate = dateTime.slice(0, IsoDateHour);
      const hit = lineData[13] === 'Hit' || lineData[13] === 'RefreshHit';
      const referer = getUrlHost(lineData[9]);

      const userAgent = UaParser.parse(lineData[10]);

      const ret = parseTileUrl(status, url);
      if (ret == null) return; // Couldn't parse tileInformation out!?

      // Aggregation date, api and referer
      const trackId = [dateAggregate, api, referer];
      // Aggregate on useragent
      if (userAgent) trackId.push(...Object.values(userAgent).map((m) => String(m)));

      let isEmpty = false;
      trackId.push(ret.tileMatrix, ret.extension, String(ret.webMercatorZoom));
      if (pipeline) trackId.push(pipeline);

      // If the bytes served back to the user is low, it could be a empty tile
      // compare it to known empty tile sizes
      const emptyBytes = EmptyTileSizes[ret.extension];
      if (emptyBytes && contentLength === emptyBytes) {
        empty[ret.extension]++;
        isEmpty = true;
      }

      const trackingId = trackId.join('_');
      let existing = stats.get(trackingId) as LogStats;
      if (existing == null) {
        existing = {
          '@timestamp': toFullDate(dateAggregate),
          api: hideApiKey(api),
          apiType: api?.slice(0, 1),
          tileMatrix: ret.tileMatrix,
          tileMatrixId: ret.tileMatrixId,
          tileSet: ret.tileSet,
          z: ret.webMercatorZoom,
          referer,
          extension: ret?.extension,
          ua: userAgent,
          pipeline,
          cacheHit: 0,
          cacheMiss: 0,
          total: 0,
          bytes: 0,
          empty: 0,
          id: sha256base58(trackingId),
        };
        stats.set(trackingId, existing);
      }

      existing.bytes += bytes;
      existing.total++;
      if (isEmpty) existing.empty++;
      if (hit) existing.cacheHit++;
      else existing.cacheMiss++;

      count++;
    }

    return new Promise((resolve, reject) => {
      lineReader.on('error', (err) => reject(err));
      lineReader.on('close', () => resolve(count));
      lineReader.on('line', processLine);
    });
  },
};

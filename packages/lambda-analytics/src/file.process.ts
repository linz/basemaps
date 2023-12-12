import { fsa, getUrlHost, isValidApiKey, LogType } from '@basemaps/shared';
import { createInterface, Interface } from 'readline';
import { createGunzip } from 'zlib';

import { LogStats } from './stats.js';
import { getUserAgent } from './ua.js';

export const FileProcess = {
  reader(url: URL): AsyncGenerator<string> | Interface {
    return createInterface({ input: fsa.readStream(url).pipe(createGunzip()) });
  },
  async process(url: URL, stats: LogStats, logger: LogType): Promise<void> {
    const lineReader = FileProcess.reader(url);
    for await (const line of lineReader) {
      if (line.startsWith('#')) continue;
      const lineData = line.split('\t');

      const date = lineData[0];
      const time = lineData[1];

      const dateStr = `${date}T${time.slice(0, 2)}:00:00.000Z`;
      if (dateStr !== stats.date) {
        logger.error({ got: dateStr, expected: stats.date, line }, 'Invalid date record');
        continue;
      }

      const uri = lineData[7];
      const status = lineData[8];
      const referer = lineData[9] === '-' ? '' : getUrlHost(lineData[9]);
      const userAgent = getUserAgent(lineData[10]);
      const query = lineData[11];
      const hit = lineData[13] === 'Hit' || lineData[13] === 'RefreshHit';

      // Ignore requests which are not tile requests
      if (!uri.startsWith('/v1')) continue;

      const search = new URLSearchParams(query);
      const apiKey = search.get('api');
      const apiValid = isValidApiKey(apiKey);
      if (apiValid.valid || apiValid.message === 'expired') {
        stats.track(apiKey as string, referer ?? '', userAgent, uri.toLowerCase(), parseInt(status), hit);
      }
    }
  },
};

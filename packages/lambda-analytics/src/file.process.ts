import { LogType, getUrlHost } from '@basemaps/shared';
import { createInterface, Interface } from 'readline';
import { createGunzip } from 'zlib';
import { s3fs } from './index';
import { LogStats } from './stats';

export const FileProcess = {
    reader(fileName: string): AsyncGenerator<string> | Interface {
        return createInterface({ input: s3fs.readStream(fileName).pipe(createGunzip()) });
    },
    async process(fileName: string, logger: LogType): Promise<void> {
        const lineReader = FileProcess.reader(fileName);
        for await (const line of lineReader) {
            if (line.startsWith('#')) continue;
            const lineData = line.split('\t');

            const date = lineData[0];
            const time = lineData[1];
            const uri = lineData[7];
            const status = lineData[8];
            const referer = lineData[9] === '-' ? undefined : getUrlHost(lineData[9]);
            const query = lineData[11];
            const hit = lineData[13] === 'Hit' || lineData[13] === 'RefreshHit';

            // Ignore requests which are not tile requests
            if (!uri.startsWith('/v1')) continue;
            const ls = LogStats.getDate(date, time);
            if (!query.startsWith('api=')) {
                logger.info({ uri, query }, 'NoApiKey');
                continue;
            }
            // TODO This could be switched to a QueryString parser
            const endIndex = query.indexOf('&');
            const apiKey = query.slice('api='.length, endIndex == -1 ? query.length : endIndex);
            ls.track(apiKey, referer, uri.toLowerCase(), parseInt(status), hit);
        }
    },
};

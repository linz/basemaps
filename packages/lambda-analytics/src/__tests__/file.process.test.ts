import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';

import { LogConfig } from '@basemaps/shared';
import { ulid } from 'ulid';

import { FileProcess } from '../file.process.js';
import { LogStats } from '../stats.js';

const DevApiKey = 'd' + ulid().toLowerCase();
const ClientApiKey = 'c' + ulid().toLowerCase();

export const ExampleLogs = `#Version: 1.0
#Fields: date time x-edge-location sc-bytes c-ip cs-method cs(Host) cs-uri-stem sc-status cs(Referer) cs(User-Agent) cs-uri-query cs(Cookie) x-edge-result-type x-edge-request-id x-host-header cs-protocol cs-bytes time-taken x-forwarded-for ssl-protocol ssl-cipher x-edge-response-result-type cs-protocol-version fle-status fle-encrypted-fields c-port time-to-first-byte x-edge-detailed-result-type sc-content-type sc-content-len sc-range-start sc-range-end
2020-07-28	01:11:25	AKL50-C1	20753	255.255.255.141	GET	d1mez8rta20vo0.cloudfront.net	/v1/tiles/aerial/EPSG:3857/19/516588/320039.webp	200	https://bar.com/	Mozilla/5.0%20(X11;%20Linux%20x86_64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/85.0.4183.101%20Safari/537.36	api=${DevApiKey}	-	Hit	sBUoz03SwR_hVZkdj0LVC1s_bKakd9ONcKTYRrQLuIR3VPBQUx5xog==	basemaps.linz.govt.nz	https	82	0.049	-	TLSv1.3	TLS_AES_128_GCM_SHA256	Hit	HTTP/2.0	--	21780	0.049	Hit	image/webp	20320	-	-
2020-07-28	01:16:13	SYD1-C2	156474	255.255.255.4	GET	d1mez8rta20vo0.cloudfront.net	/v1/tiles/aerial/NZTM2000Quad/19/516542/319785.png	200	https://www.bar.com/	Mozilla/5.0%20(Macintosh;%20Intel%20Mac%20OS%20X%2010_15_4)%20AppleWebKit/605.1.15%20(KHTML,%20like%20Gecko)%20Version/13.1.2%20Safari/605.1.15	api=${DevApiKey}&foo=bar	-	Hit	9KNnEESjZA-yVs62ffwtRYNaa0gpYKLeEEHH490dmO7AAu3ZxnPc8Q==	basemaps.linz.govt.nz	https	77	1.791	-	TLSv1.3	TLS_AES_128_GCM_SHA256	Hit	HTTP/2.0	-	-	19468	0.028	Hit	image/png	155886	-	-
2020-07-28	01:16:21	SYD1-C2	21223	255.255.255.73	GET	d1mez8rta20vo0.cloudfront.net	/v1/tiles/topo50/3857/18/257866/162011.jpeg	200	https://bar.com/map/	Mozilla/5.0%20(Windows%20NT%2010.0;%20Win64;%20x64)%20AppleWebKit/537.36%20(KHTML,%20like%20Gecko)%20Chrome/85.0.4183.102%20Safari/537.36	api=${DevApiKey}	-	Miss	a5nrTCsdsP5EDQ9EXkUQQJMCJTlbRUz5JIxowZ-1kRriRDUmLPxvVQ==	basemaps.linz.govt.nz	https	76	0.222	-	TLSv1.3	TLS_AES_128_GCM_SHA256	Miss	HTTP/2.0	-	-	57799	0.222	Miss	image/jpeg	20797	-	-
2020-07-28	01:13:33	SYD4-C2	2588	255.255.255.128	GET	d1mez8rta20vo0.cloudfront.net	/v1/tiles/topo50/EPSG:3857/WMTSCapabilities.xml	200	-	Mozilla/5.0%20QGIS/31006	api=${ClientApiKey}	-	RefreshHit	oflBr-vO5caoVpi2S23hGh9YWMUca-McU_Fl5oN9fqW_H9ea_iS-Kg==	basemaps.linz.govt.nz	https	243	0.051	-	TLSv1.2	ECDHE-RSA-AES128-GCM-SHA256	RefreshHit	HTTP/1.1	-	-	55515	0.050	RefreshHit	text/xml	-
2020-07-28	01:13:33	SYD4-C2	2588	255.255.255.128	GET	d1mez8rta20vo0.cloudfront.net	/v1/tiles/topo50/EPSG:2193/18/257866/162011.pbf	200	-	Mozilla/5.0%20QGIS/31006	api=${ClientApiKey}	-	RefreshHit	oflBr-vO5caoVpi2S23hGh9YWMUca-McU_Fl5oN9fqW_H9ea_iS-Kg==	basemaps.linz.govt.nz	https	243	0.051	-	TLSv1.2	ECDHE-RSA-AES128-GCM-SHA256	RefreshHit	HTTP/1.1	-	-	55515	0.050	RefreshHit	text/xml	-
2020-07-28	01:13:33	SYD4-C2	2588	255.255.255.128	GET	d1mez8rta20vo0.cloudfront.net	/v1/tiles/antipodes-islands-satellite-2019-2020-0.5m/NZTM2000Quad/18/257866/162011.webp	200	-	Mozilla/5.0%20QGIS/31006	api=${ClientApiKey}	-	RefreshHit	oflBr-vO5caoVpi2S23hGh9YWMUca-McU_Fl5oN9fqW_H9ea_iS-Kg==	basemaps.linz.govt.nz	https	243	0.051	-	TLSv1.2	ECDHE-RSA-AES128-GCM-SHA256	RefreshHit	HTTP/1.1	-	-	55515	0.050	RefreshHit	text/xml	-
2020-07-28	01:13:33	SYD4-C2	2588	255.255.255.128	GET	d1mez8rta20vo0.cloudfront.net	/v1/tiles/elevation/WebMercatorQuad/18/257866/162011.png	200	-	Mozilla/5.0%20QGIS/31006	api=${ClientApiKey}&pipeline=terrain-rgb	-	RefreshHit	oflBr-vO5caoVpi2S23hGh9YWMUca-McU_Fl5oN9fqW_H9ea_iS-Kg==	basemaps.linz.govt.nz	https	243	0.051	-	TLSv1.2	ECDHE-RSA-AES128-GCM-SHA256	RefreshHit	HTTP/1.1	-	-	55515	0.050	RefreshHit	text/xml	-
`
  .trim()
  .split('\n');

export function lineReader(lines: string[], date?: string): () => AsyncGenerator<string> {
  const dateStr = date == null ? '2020-07-28	01' : date.slice(0, 13).replace('T', '	');
  return async function* lineByLine(): AsyncGenerator<string> {
    for (const line of lines) {
      if (line.startsWith('#')) yield line;
      else yield dateStr + line.slice(dateStr.length);
    }
  };
}

// Utility to dump the indexes from the '#Fields' line in cloudwatch
export const CloudWatchIndexes = {
  dump(): void {
    const fields = ExampleLogs[1].replace('#Fields: ', '').split(' ');
    for (let i = 0; i < fields.length; i++) {
      console.log(i, fields[i]);
    }
  },
};

describe('FileProcess', () => {
  const originalReader = FileProcess.reader;
  afterEach(() => {
    FileProcess.reader = originalReader;
    LogStats.ByDate.clear();
  });
  it('should extract and track a api hit', async () => {
    FileProcess.reader = lineReader([ExampleLogs[2]]);
    const logData = LogStats.getDate('2020-07-28T01:00:00.000Z');
    await FileProcess.process(new URL('s3://fake/'), logData, LogConfig.get());
    assert.equal(LogStats.ByDate.size, 1);
    assert.equal(logData.stats.size, 1);
    const apiStats = logData.getStats(DevApiKey, 'bar.com');

    assert.equal(apiStats?.apiType, 'd');
    assert.equal(apiStats?.total, 1);
    assert.deepEqual(apiStats?.cache, { hit: 1, miss: 0 });
    assert.deepEqual(apiStats?.tileMatrix, { WebMercatorQuad: 1 });
  });

  it('should extract and track a bunch of hits', async () => {
    const logData = LogStats.getDate('2020-07-28T01:00:00.000Z');

    FileProcess.reader = lineReader(ExampleLogs);
    await FileProcess.process(new URL('s3://fake/'), logData, LogConfig.get());
    assert.equal(LogStats.ByDate.size, 1);

    assert.equal(logData.stats.size, 2);
    const devStats = logData.getStats(DevApiKey, 'bar.com');
    const clientStats = logData.getStats(ClientApiKey, '');

    assert.equal(devStats?.total, 3);
    assert.equal(devStats?.apiType, 'd');
    assert.deepEqual(devStats?.cache, { hit: 2, miss: 1 });
    assert.deepEqual(devStats?.tileMatrix, { WebMercatorQuad: 2, NZTM2000Quad: 1 });
    assert.deepEqual(devStats?.extension, { webp: 1, jpeg: 1, png: 1, wmts: 0, other: 0, pbf: 0 });
    assert.deepEqual(devStats?.tileSet, { aerial: 2, topo50: 1 });

    assert.equal(clientStats?.total, 4);
    assert.equal(clientStats?.apiType, 'c');
    assert.deepEqual(clientStats?.cache, { hit: 4, miss: 0 });
    assert.deepEqual(clientStats?.tileMatrix, { WebMercatorQuad: 2, NZTM2000: 1, NZTM2000Quad: 1 });
    assert.deepEqual(clientStats?.extension, { webp: 1, jpeg: 0, png: 1, wmts: 1, other: 0, pbf: 1 });
    assert.deepEqual(clientStats?.tileSet, {
      topo50: 2,
      'antipodes-islands-satellite-2019-2020-0.5m': 1,
      elevation: 1,
    });

    assert.deepEqual(clientStats?.pipeline, {
      'terrain-rgb': 1,
    });
  });
});

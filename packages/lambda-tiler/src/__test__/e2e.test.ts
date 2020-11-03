import o from 'ospec';
import fetch from 'node-fetch';
import * as path from 'path';
import * as fs from 'fs';
import { Env, getApiKey } from '@basemaps/shared';

o.spec('E2E test for lambda-tiler', () => {
    const ApiKey = getApiKey();
    let baseUrl = 'https://tiles.dev.basemaps.linz.govt.nz';
    if (Env.isProduction()) {
        baseUrl = 'https://tiles.basemaps.linz.govt.nz';
    }

    o('should return version', async () => {
        o.timeout(5 * 1000);

        // Given ... a get version request
        const getVersionUrl = baseUrl + '/v1/version' + '?api=' + ApiKey;

        // When ...
        const response = await fetch(getVersionUrl);

        // Then ...
        o(response.status).equals(200);
        o(response.statusText).equals('OK');
        const ResponseJson = await response.json();
        const ResponseVersion = ResponseJson.version.split('-')[0];
        const packagePath = path.join(__dirname, '..', '..', 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath).toString());
        const packageVersion = 'v' + packageJson.version;
        o(ResponseVersion).equals(packageVersion);
    });

    o('should return valid health', async () => {
        o.timeout(5 * 1000);

        // Given ... a get version request
        const getHealthUrl = baseUrl + '/v1/health' + '?api=' + ApiKey;

        // When ...
        const response = await fetch(getHealthUrl);

        // Then ...
        o(response.status).equals(200);
        o(response.statusText).equals('OK');
    });
});

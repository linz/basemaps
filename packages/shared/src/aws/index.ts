import * as AWS from 'aws-sdk';
import { Agent } from 'https';
import { Const } from '../const';

/**
 * AWS by default does not reuse http connections this causes requests to the same service
 * (S3, Dynamo, etc) to open a new HTTPS connection for every request the TLS handshake adds
 * a lot of delay to every request (50+ms)
 *
 * This logic caches open TLS connections so that they can be reused
 *
 * **This needs to happen before anything tries to use the AWS SDK**
 */
const sslAgent = new Agent({
    keepAlive: true,
    maxSockets: 50,
    rejectUnauthorized: true,
});

AWS.config.update({
    region: Const.Aws.Region,
    httpOptions: {
        agent: sslAgent,
    },
});

import { ApiKeyTable } from './api.key.table';

export const Aws = {
    sdk: AWS,
    api: {
        db: new ApiKeyTable(),
    },
};

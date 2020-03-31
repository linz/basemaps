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
const agent = new Agent({
    keepAlive: true,
    maxSockets: 50,
    rejectUnauthorized: true,
});

AWS.config.update({
    region: Const.Aws.Region,
    httpOptions: { agent },
});

import { ApiKeyTable } from './api.key.table';
import { TileMetadataTable } from './tile.metadata.table';
import { S3Cache, CredentialsCache, StsAssumeRoleConfig } from './credentials';

const s3 = new AWS.S3();
export const Aws = {
    sdk: AWS,
    credentials: {
        /**
         * Get a s3 that is bound to a specific role
         */
        getS3ForRole(opts?: StsAssumeRoleConfig): AWS.S3 {
            if (opts == null) {
                return s3;
            }
            return S3Cache.getOrMake(opts.roleArn, opts);
        },
        getCredentialsForRole(roleArn: string, externalId: string): AWS.ChainableTemporaryCredentials {
            return CredentialsCache.getOrMake(roleArn, { roleArn, externalId });
        },
    },
    api: {
        db: new ApiKeyTable(),
    },
    tileMetadata: {
        db: new TileMetadataTable(),
    },
};

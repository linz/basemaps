import { ObjectCache } from './object.cache';
import { hostname } from 'os';
import { Env } from '../const';
import { ChainableTemporaryCredentials } from 'aws-sdk/lib/credentials/chainable_temporary_credentials';
import AWS from 'aws-sdk/lib/core';
import S3 from 'aws-sdk/clients/s3';

export interface StsAssumeRoleConfig {
    roleArn: string;
    externalId?: string;
}

const OneHourSeconds = 60 * 60;
const AwsRoleDurationSeconds = Env.getNumber(Env.AwsRoleDurationHours, 8) * OneHourSeconds;

/**
 * Credentials need to be cached or a separate assume role will be called for each individual
 * instance of the credential chain
 */
class CredentialObjectCache extends ObjectCache<ChainableTemporaryCredentials, StsAssumeRoleConfig> {
    create(opts: StsAssumeRoleConfig): ChainableTemporaryCredentials {
        return new AWS.ChainableTemporaryCredentials({
            params: {
                RoleArn: opts.roleArn,
                ExternalId: opts.externalId,
                RoleSessionName: `bm-${hostname().substr(0, 32)}-${Date.now()}`,
                DurationSeconds: AwsRoleDurationSeconds,
            },
            // TODO can we fix this
            // masterCredentials: AWS.config.credentials as Credentials,
        });
    }
}
export const CredentialsCache = new CredentialObjectCache();

class S3ObjectCache extends ObjectCache<S3, StsAssumeRoleConfig> {
    create(opt: StsAssumeRoleConfig): S3 {
        const credentials = CredentialsCache.getOrMake(opt.roleArn, opt);
        return new S3({ credentials });
    }
}

export const S3Cache = new S3ObjectCache();

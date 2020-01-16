import { ObjectCache } from './object.cache';
import * as AWS from 'aws-sdk';
import { hostname } from 'os';

export interface StsAssumeRoleConfig {
    roleArn: string;
    externalId: string;
}

/**
 * Credentials need to be cached or a separate assume role will be called for each individual
 * instance of the credential chain
 */
class CredentialObjectCache extends ObjectCache<AWS.ChainableTemporaryCredentials, StsAssumeRoleConfig> {
    create(opts: StsAssumeRoleConfig): AWS.ChainableTemporaryCredentials {
        return new AWS.ChainableTemporaryCredentials({
            params: {
                RoleArn: opts.roleArn,
                ExternalId: opts.externalId,
                RoleSessionName: `bm-${hostname()}-${Date.now()}`,
            },
            masterCredentials: AWS.config.credentials as AWS.Credentials,
        });
    }
}
export const CredentialsCache = new CredentialObjectCache();

class S3ObjectCache extends ObjectCache<AWS.S3, StsAssumeRoleConfig> {
    create(opt: StsAssumeRoleConfig): AWS.S3 {
        const credentials = CredentialsCache.getOrMake(opt.roleArn, opt);
        return new AWS.S3({ credentials });
    }
}

export const S3Cache = new S3ObjectCache();

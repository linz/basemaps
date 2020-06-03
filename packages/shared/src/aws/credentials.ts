import { ObjectCache } from './object.cache';
import * as AWS from 'aws-sdk';
import { hostname } from 'os';
import { Env } from '../const';

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
class CredentialObjectCache extends ObjectCache<AWS.ChainableTemporaryCredentials, StsAssumeRoleConfig> {
    create(opts: StsAssumeRoleConfig): AWS.ChainableTemporaryCredentials {
        return new AWS.ChainableTemporaryCredentials({
            params: {
                RoleArn: opts.roleArn,
                ExternalId: opts.externalId,
                RoleSessionName: `bm-${hostname().substr(0, 32)}-${Date.now()}`,
                DurationSeconds: AwsRoleDurationSeconds,
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

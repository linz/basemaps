import { ObjectCache } from './object.cache.js';
import { hostname } from 'os';
import { Env } from '../const.js';
import ctc from 'aws-sdk/lib/credentials/chainable_temporary_credentials.js';
import aws from 'aws-sdk/lib/core.js';
import S3 from 'aws-sdk/clients/s3.js';

export interface StsAssumeRoleConfig {
    roleArn: string;
    externalId?: string;
}

const OneHourSeconds = 60 * 60;

const awsProfile = process.env['AWS_PROFILE'];
const masterCredentials = awsProfile
    ? new aws.SharedIniFileCredentials({ profile: awsProfile })
    : new aws.EC2MetadataCredentials();

/**
 * Credentials need to be cached or a separate assume role will be called for each individual
 * instance of the credential chain
 */
class CredentialObjectCache extends ObjectCache<ctc.ChainableTemporaryCredentials, StsAssumeRoleConfig> {
    create(opts: StsAssumeRoleConfig): ctc.ChainableTemporaryCredentials {
        return new aws.ChainableTemporaryCredentials({
            params: {
                RoleArn: opts.roleArn,
                ExternalId: opts.externalId,
                RoleSessionName: `bm-${hostname().substr(0, 32)}-${Date.now()}`,
                DurationSeconds: Env.getNumber(Env.AwsRoleDurationHours, 8) * OneHourSeconds,
            },
            masterCredentials,
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

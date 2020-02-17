import { Aws, LogType, Const, LambdaHttpResponseCloudFront, HttpHeader, LambdaSession } from '@basemaps/lambda-shared';

export const ValidateRequest = {
    /**
     * Validate that a API Key is valid
     * @param apiKey API key to validate
     */
    async validate(apiKey: string, session: LambdaSession, log: LogType): Promise<LambdaHttpResponseCloudFront | null> {
        const timer = session.timer;
        // TODO increment the api counter
        timer.start('validate:db');
        const record = await Aws.api.db.get(apiKey);
        timer.end('validate:db');

        if (record == null) {
            return new LambdaHttpResponseCloudFront(403, 'Invalid API Key');
        }
        log.info({ record }, 'Record');

        if (record.lockToIp != null) {
            // TODO lock ip
        }

        if (record.lockToReferrer != null) {
            // TODO lock referrer
        }

        if (record.enabled === false) {
            return new LambdaHttpResponseCloudFront(403, 'API key disabled');
        }

        const recordLimit = record.minuteLimit || Const.ApiKey.RequestLimitMinute;
        if (record.minuteExpireAt > Date.now() && record.minuteCount > recordLimit) {
            return new LambdaHttpResponseCloudFront(429, `Too many API Requests current: ${record.minuteCount}`, {
                [HttpHeader.RateLimit]: String(recordLimit),
                [HttpHeader.RateCount]: String(record.minuteCount), // TODO is this the right header
                [HttpHeader.RateExpire]: String(record.minuteExpireAt),
            });
        }
        return null;
    },
};

import { Aws, Const } from '@basemaps/shared';
import { HttpHeader, LambdaContext, LambdaHttpResponse } from '@basemaps/lambda';

export const ValidateRequest = {
    /**
     * Validate that a API Key is valid
     * @param apiKey API key to validate
     */
    async validate(ctx: LambdaContext): Promise<LambdaHttpResponse | null> {
        const timer = ctx.timer;

        if (ctx.apiKey == null) return new LambdaHttpResponse(400, 'Invalid API Key');

        // TODO increment the api counter
        timer.start('validate:db');
        const record = await Aws.apiKey.get(ctx.apiKey);
        timer.end('validate:db');

        if (record == null) return null; // Allow invalid keys for now

        ctx.log.info({ record }, 'Record');

        if (record.lockToIp != null) {
            // TODO lock ip
        }

        if (record.lockToReferrer != null) {
            // TODO lock referrer
        }

        if (record.enabled === false) {
            return new LambdaHttpResponse(403, 'API key disabled');
        }

        const recordLimit = record.minuteLimit || Const.ApiKey.RequestLimitMinute;
        if (record.minuteExpireAt > Date.now() && record.minuteCount > recordLimit) {
            return new LambdaHttpResponse(429, `Too many API Requests current: ${record.minuteCount}`, {
                [HttpHeader.RateLimit]: String(recordLimit),
                [HttpHeader.RateCount]: String(record.minuteCount), // TODO is this the right header
                [HttpHeader.RateExpire]: String(record.minuteExpireAt),
            });
        }
        return null;
    },
};

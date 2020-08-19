import { LambdaContext, LambdaHttpResponse } from '@basemaps/lambda';
import * as ulid from 'ulid';

const OneHourMs = 60 * 60 * 1000;
const OneDayMs = 24 * OneHourMs;
const MaxApiAgeMs = 91 * OneDayMs;

export const ValidateRequest = {
    /** Validate that the API key is in a correct format */
    isValidApiKey(apiKey: string): boolean {
        if (!apiKey.startsWith('c') && !apiKey.startsWith('d')) return false;
        const ulidId = apiKey.slice(1).toUpperCase();
        try {
            const ulidTime = ulid.decodeTime(ulidId);
            if (apiKey.startsWith('d')) return true;

            if (Date.now() - ulidTime > MaxApiAgeMs) {
                return false;
            }
        } catch (e) {
            return false;
        }

        return true;
    },
    /**
     * Validate that a API Key is valid
     * @param apiKey API key to validate
     */
    async validate(ctx: LambdaContext): Promise<LambdaHttpResponse | null> {
        // const timer = ctx.timer;

        if (ctx.apiKey == null) return new LambdaHttpResponse(400, 'Invalid API Key');

        if (!ValidateRequest.isValidApiKey(ctx.apiKey)) {
            return new LambdaHttpResponse(400, 'Invalid API Key');
        }
        return null;

        // TODO this needs to be re-architected, the query times for database validation are too long
        // We are seeing up to 99% response times of over 1 second.
        // timer.start('validate:db');
        // const record = await Aws.apiKey.get(ctx.apiKey);
        // timer.end('validate:db');

        // if (record == null) return null; // Allow invalid keys for now

        // if (record.lockToIp != null) {
        //     // TODO lock ip
        // }

        // if (record.lockToReferrer != null) {
        //     // TODO lock referrer
        // }

        // if (record.enabled === false) {
        //     return new LambdaHttpResponse(403, 'API key disabled');
        // }

        // const recordLimit = record.minuteLimit || Const.ApiKey.RequestLimitMinute;
        // if (record.minuteExpireAt > Date.now() && record.minuteCount > recordLimit) {
        //     return new LambdaHttpResponse(429, `Too many API Requests current: ${record.minuteCount}`, {
        //         [HttpHeader.RateLimit]: String(recordLimit),
        //         [HttpHeader.RateCount]: String(record.minuteCount), // TODO is this the right header
        //         [HttpHeader.RateExpire]: String(record.minuteExpireAt),
        //     });
        // }
        // return null;
    },
};

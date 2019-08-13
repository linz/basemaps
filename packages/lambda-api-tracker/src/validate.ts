import { Aws, Logger, Const } from '@basemaps/shared';

export interface ValidateRequestResponse {
    status: number;
    reason: string;
    headers?: { [key: string]: string };
}

export const ValidateRequest = {
    /**
     * Validate that a API Key is valid
     * @param apiKey API key to validate
     */
    async validate(apiKey: string | null | undefined, log: typeof Logger): Promise<ValidateRequestResponse> {
        if (apiKey == null) {
            return { status: 400, reason: 'Invalid API Key' };
        }

        // TODO increment the api counter
        const record = await Aws.api.db.get(apiKey);
        if (record == null) {
            return { status: 403, reason: 'Invalid API Key' };
        }
        log.info({ record }, 'Record');

        if (record.lockToIp != null) {
            // TODO lock ip
        }

        if (record.lockToReferrer != null) {
            // TODO lock referrer
        }

        if (record.enabled === false) {
            return { status: 403, reason: 'API key disabled' };
        }

        const recordLimit = record.minuteLimit || Const.ApiKey.RequestLimitMinute;
        if (record.minuteExpireAt > Date.now() && record.minuteCount > recordLimit) {
            return {
                status: 429,
                reason: `Too many API Requests current: ${record.minuteCount}`,
                headers: {
                    'X-RateLimit-Limit': String(recordLimit),
                    'X-RateLimit-Expires': String(record.minuteExpireAt),
                },
            };
        }

        return {
            status: 200,
            reason: `Count ${record.minuteCount}`,
            headers: {
                'X-RateLimit-Limit': String(recordLimit),
                'X-RateLimit-Count': String(record.minuteCount), // TODO is this the right header
                'X-RateLimit-Expires': String(record.minuteExpireAt),
            },
        };
    },
};

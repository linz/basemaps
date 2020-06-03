import { LambdaContext } from '@basemaps/lambda';
import { ApiKeyTableRecord, Aws, LogConfig } from '@basemaps/shared';
import * as o from 'ospec';
import { ValidateRequest } from '../validate';

o.spec('ApiValidate', (): void => {
    const dummyApiKey = 'dummy1';
    const faultyApiKey = 'fault1';
    const mockApiKey = 'mock1';

    const oldGet = Aws.apiKey.get;
    o.beforeEach(() => {
        LogConfig.disable();
    });
    o.afterEach(() => {
        Aws.apiKey.get = oldGet;
    });

    function makeContext(): LambdaContext {
        return new LambdaContext({} as any, LogConfig.get());
    }

    o('validate should fail on faulty apikey', async () => {
        let lastApiKey = '';
        Aws.apiKey.get = async (apiKey): Promise<ApiKeyTableRecord> => {
            lastApiKey = apiKey;
            return {
                id: apiKey,
                updatedAt: 1,
                createdAt: 1,
                enabled: false,
                minuteExpireAt: 100,
                minuteCount: 100,
            } as ApiKeyTableRecord;
        };
        const result = await ValidateRequest.validate(faultyApiKey, makeContext());
        o(result).notEquals(null);
        if (result == null) throw new Error('Validate returns null result');

        o(lastApiKey).equals(faultyApiKey);
        o(result.status).equals(403);
        o(result.statusDescription).equals('API key disabled');
    });

    o('validate should fail on null record', async () => {
        Aws.apiKey.get = async (): Promise<null> => null;
        const result = await ValidateRequest.validate(dummyApiKey, makeContext());
        o(result).notEquals(null);
        if (result == null) throw new Error('Validate returns null result');

        o(result.status).equals(403);
        o(result.statusDescription).equals('Invalid API Key');
    });

    o('validate should fail with rate limit error', async () => {
        const mockMinuteCount = 1e4;
        const mockMinuteExpireAt = Date.now() * 1.01;
        Aws.apiKey.get = async (apiKey): Promise<ApiKeyTableRecord> => {
            return {
                id: apiKey,
                updatedAt: 1,
                createdAt: 1,
                enabled: true,
                minuteExpireAt: mockMinuteExpireAt,
                minuteCount: mockMinuteCount,
            } as ApiKeyTableRecord;
        };
        const result = await ValidateRequest.validate(mockApiKey, makeContext());
        o(result).notEquals(null);
        if (result == null) throw new Error('Validate returns null result');

        o(result.status).equals(429);
        o(result.statusDescription).equals('Too many API Requests current: ' + mockMinuteCount);
    });
});

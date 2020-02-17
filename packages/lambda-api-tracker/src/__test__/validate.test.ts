import { ApiKeyTableRecord, Aws, LambdaSession, LogConfig } from '@basemaps/lambda-shared';
import { ValidateRequest } from '../validate';
import * as o from 'ospec';

o.spec('ApiValidate', (): void => {
    const dummyApiKey = 'dummy1';
    const faultyApiKey = 'fault1';
    const mockApiKey = 'mock1';

    const oldGet = Aws.api.db.get;
    o.beforeEach(() => {
        LogConfig.disable();
    });
    o.afterEach(() => {
        Aws.api.db.get = oldGet;
    });

    o('validate should fail on faulty apikey', async () => {
        let lastApiKey = '';
        Aws.api.db.get = async (apiKey): Promise<ApiKeyTableRecord> => {
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
        const result = await ValidateRequest.validate(faultyApiKey, new LambdaSession(), LogConfig.get());
        o(result).notEquals(null);
        if (result == null) throw new Error('Validate returns null result');

        o(lastApiKey).equals(faultyApiKey);
        o(result.status).equals(403);
        o(result.statusDescription).equals('API key disabled');
    });

    o('validate should fail on null record', async () => {
        Aws.api.db.get = async (): Promise<null> => null;
        const result = await ValidateRequest.validate(dummyApiKey, new LambdaSession(), LogConfig.get());
        o(result).notEquals(null);
        if (result == null) throw new Error('Validate returns null result');

        o(result.status).equals(403);
        o(result.statusDescription).equals('Invalid API Key');
    });

    o('validate should fail with rate limit error', async () => {
        const mockMinuteCount = 1e4;
        const mockMinuteExpireAt = Date.now() * 1.01;
        Aws.api.db.get = async (apiKey): Promise<ApiKeyTableRecord> => {
            return {
                id: apiKey,
                updatedAt: 1,
                createdAt: 1,
                enabled: true,
                minuteExpireAt: mockMinuteExpireAt,
                minuteCount: mockMinuteCount,
            } as ApiKeyTableRecord;
        };
        const result = await ValidateRequest.validate(mockApiKey, new LambdaSession(), LogConfig.get());
        o(result).notEquals(null);
        if (result == null) throw new Error('Validate returns null result');

        o(result.status).equals(429);
        o(result.statusDescription).equals('Too many API Requests current: ' + mockMinuteCount);
    });
});

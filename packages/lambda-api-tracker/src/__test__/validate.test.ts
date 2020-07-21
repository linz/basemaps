import { LambdaContext } from '@basemaps/lambda';
import { ApiKeyTableRecord, Aws, LogConfig } from '@basemaps/shared';
import o from 'ospec';
import { ValidateRequest } from '../validate';

o.spec('ApiValidate', (): void => {
    const faultyApiKey = 'fault1';
    const mockApiKey = 'mock1';

    const oldGet = Aws.apiKey.get;
    o.beforeEach(() => {
        LogConfig.disable();
    });
    o.afterEach(() => {
        Aws.apiKey.get = oldGet;
    });

    function makeContext(apiKey: string): LambdaContext {
        const ctx = new LambdaContext({} as any, LogConfig.get());
        ctx.apiKey = apiKey;
        return ctx;
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
        const result = await ValidateRequest.validate(makeContext(faultyApiKey));
        o(result).notEquals(null);
        if (result == null) throw new Error('Validate returns null result');

        o(lastApiKey).equals(faultyApiKey);
        o(result.status).equals(403);
        o(result.statusDescription).equals('API key disabled');
    });

    // TODO this should be re-enabled at some stage
    // o('validate should fail on null record', async () => {
    //     Aws.apiKey.get = async (): Promise<null> => null;
    //     const result = await ValidateRequest.validate(makeContext(dummyApiKey));
    //     o(result).notEquals(null);
    //     if (result == null) throw new Error('Validate returns null result');

    //     o(result.status).equals(403);
    //     o(result.statusDescription).equals('Invalid API Key');
    // });

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
        const result = await ValidateRequest.validate(makeContext(mockApiKey));
        o(result).notEquals(null);
        if (result == null) throw new Error('Validate returns null result');

        o(result.status).equals(429);
        o(result.statusDescription).equals('Too many API Requests current: ' + mockMinuteCount);
    });
});

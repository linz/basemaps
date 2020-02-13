import { ApiKeyTableRecord, Aws, LambdaSession, LogConfig } from '@basemaps/lambda-shared';
import { ValidateRequest } from '../validate';

describe('QueryString', (): void => {
    const dummyApiKey = 'dummy1';
    const faultyApiKey = 'fault1';
    const mockApiKey = 'mock1';

    beforeEach(() => {
        LambdaSession.reset();
        LogConfig.disable();
    });

    it('tests that apikeytable gets called', (): void => {
        const spy = jest.spyOn(Aws.api.db, 'get').mockImplementation();
        ValidateRequest.validate(dummyApiKey, LogConfig.get());

        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledWith(dummyApiKey);
    });

    it('validate should fail on faulty apikey', async () => {
        const spy = jest.spyOn(Aws.api.db, 'get').mockImplementation(async apiKey => {
            const record: ApiKeyTableRecord = {
                id: apiKey,
                updatedAt: 1,
                createdAt: 1,
                enabled: false,
                minuteExpireAt: 100,
                minuteCount: 100,
            };
            return record;
        });
        const result = await ValidateRequest.validate(faultyApiKey, LogConfig.get());
        expect(result).not.toBe(null);
        if (result == null) throw new Error('Validate returns null result');

        expect(result.status).toBe(403);
        expect(result.statusDescription).toBe('API key disabled');
        spy.mockRestore();
    });

    it('validate should fail on null record', async () => {
        const spy = jest.spyOn(Aws.api.db, 'get').mockImplementation(async () => {
            return null;
        });
        const result = await ValidateRequest.validate(dummyApiKey, LogConfig.get());
        expect(result).not.toBe(null);
        if (result == null) throw new Error('Validate returns null result');

        expect(result.status).toBe(403);
        expect(result.statusDescription).toBe('Invalid API Key');
        spy.mockRestore();
    });

    it('validate should fail with rate limit error', async () => {
        const mockMinuteCount = 1e4;
        const mockMinuteExpireAt = Date.now() * 1.01;
        const spy = jest.spyOn(Aws.api.db, 'get').mockImplementation(async apiKey => {
            const record: ApiKeyTableRecord = {
                id: apiKey,
                updatedAt: 1,
                createdAt: 1,
                enabled: true,
                minuteExpireAt: mockMinuteExpireAt,
                minuteCount: mockMinuteCount,
            };
            return record;
        });
        const result = await ValidateRequest.validate(mockApiKey, LogConfig.get());
        expect(result).not.toBe(null);
        if (result == null) throw new Error('Validate returns null result');

        expect(result.status).toBe(429);
        expect(result.statusDescription).toBe('Too many API Requests current: ' + mockMinuteCount);
        spy.mockRestore();
    });
});

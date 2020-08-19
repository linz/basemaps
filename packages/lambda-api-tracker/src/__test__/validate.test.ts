import { LambdaContext } from '@basemaps/lambda';
import { Aws, LogConfig } from '@basemaps/shared';
import o from 'ospec';
import * as ulid from 'ulid';
import { ValidateRequest } from '../validate';

o.spec('ApiValidate', (): void => {
    // const FakeApiKey = `c${ulid.ulid()}`.toLowerCase();

    const oldGet = Aws.apiKey.get;
    o.beforeEach(() => {
        Aws.apiKey.get = async (): Promise<null> => null;

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

    // TODO re-enable when API Keys are being validated
    // o('validate should fail on faulty apikey', async () => {
    //     let lastApiKey = '';
    //     Aws.apiKey.get = async (apiKey): Promise<ApiKeyTableRecord> => {
    //         lastApiKey = apiKey;
    //         return {
    //             id: apiKey,
    //             updatedAt: 1,
    //             createdAt: 1,
    //             enabled: false,
    //             minuteExpireAt: 100,
    //             minuteCount: 100,
    //         } as ApiKeyTableRecord;
    //     };
    //     const result = await ValidateRequest.validate(makeContext(FakeApiKey));
    //     o(result).notEquals(null);
    //     if (result == null) throw new Error('Validate returns null result');

    //     o(lastApiKey).equals(FakeApiKey);
    //     o(result.status).equals(403);
    //     o(result.statusDescription).equals('API key disabled');
    // });

    o('should validate ulid api keys', async () => {
        const newId = ulid.ulid();
        const result = await ValidateRequest.validate(makeContext(`c${newId.toLowerCase()}`));
        o(result).equals(null);
    });

    o('should fail expired api keys', async () => {
        const newId = ulid.ulid();

        const oldTime = ulid.encodeTime(ulid.decodeTime(newId), 10);
        const oldId = newId.replace(oldTime, ulid.encodeTime(new Date('2019-01-01').getTime(), 10));

        const result = await ValidateRequest.validate(makeContext(`c${oldId.toLowerCase()}`));
        o(result).notEquals(null);
        o(result?.status).equals(400);
    });

    o('should not fail old developer api keys', async () => {
        const newId = ulid.ulid();

        const oldTime = ulid.encodeTime(ulid.decodeTime(newId), 10);
        const oldId = newId.replace(oldTime, ulid.encodeTime(new Date('2019-01-01').getTime(), 10));

        const result = await ValidateRequest.validate(makeContext(`d${oldId.toLowerCase()}`));
        o(result).equals(null);
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
    //
    // o('validate should fail with rate limit error', async () => {
    //     const mockMinuteCount = 1e4;
    //     const mockMinuteExpireAt = Date.now() * 1.01;
    //     Aws.apiKey.get = async (apiKey): Promise<ApiKeyTableRecord> => {
    //         return {
    //             id: apiKey,
    //             updatedAt: 1,
    //             createdAt: 1,
    //             enabled: true,
    //             minuteExpireAt: mockMinuteExpireAt,
    //             minuteCount: mockMinuteCount,
    //         } as ApiKeyTableRecord;
    //     };
    //     const result = await ValidateRequest.validate(makeContext(FakeApiKey));
    //     o(result).notEquals(null);
    //     if (result == null) throw new Error('Validate returns null result');

    //     o(result.status).equals(429);
    //     o(result.statusDescription).equals('Too many API Requests current: ' + mockMinuteCount);
    // });
});

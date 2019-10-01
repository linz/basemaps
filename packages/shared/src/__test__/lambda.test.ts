/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { LambdaFunction } from '../lambda';

describe('LambdaFunction', () => {
    it('should callback on success', async () => {
        const testFunc = LambdaFunction.wrap(async (a: any, b: any, c: any) => 'Done' as any);

        const cbSpy = jest.fn();
        await testFunc(null, null as any, cbSpy);
        expect(cbSpy).toBeCalledTimes(1);
        expect(cbSpy).toBeCalledWith(undefined, 'Done');
    });

    it('should callback on error', async () => {
        const err = new Error('Done');
        const testFunc = LambdaFunction.wrap(async (a: any, b: any, c: any) => {
            throw err;
        });

        const cbSpy = jest.fn();
        await testFunc(null, null as any, cbSpy);
        expect(cbSpy).toBeCalledTimes(1);
        expect(cbSpy).toBeCalledWith(err, undefined);
    });
});

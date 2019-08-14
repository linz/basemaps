import * as AWS from 'aws-sdk';

describe('AWS Init', () => {
    it('should update the aws config', () => {
        let opts: any;
        const updateSpy = jest.spyOn(AWS.config, 'update').mockImplementationOnce(o => (opts = o));

        require('../index');

        expect(updateSpy).toBeCalledTimes(1);
        expect(opts).toBeTruthy();
        expect(opts['httpOptions']).toBeTruthy();
    });
});

import o from 'ospec';

o.spec('AWS Init', (): void => {
    o('should update the aws config', (): void => {
        o(process.env['AWS_NODEJS_CONNECTION_REUSE_ENABLED']).equals('1');
    });
});

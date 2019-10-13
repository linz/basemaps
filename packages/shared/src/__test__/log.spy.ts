import { LogConfig } from '../log';

export const LogSpy = jest.spyOn(LogConfig.getOutputStream(), 'write').mockImplementation();

beforeEach(() => {
    LogSpy.mockClear();
});

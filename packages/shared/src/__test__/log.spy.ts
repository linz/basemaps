import { LogConfig } from '../log';
import * as pino from 'pino';
import { Writable } from 'stream';

export const FakeStream = new Writable();

export const LogPino = pino(FakeStream);
export const LogSpy = jest.spyOn(FakeStream, 'write').mockImplementation();

beforeEach(() => {
    LogConfig.set(LogPino);
    LogSpy.mockClear();
});

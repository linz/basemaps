import o from 'ospec';
import { LogType } from '@basemaps/shared';

export type LogSpyType = LogType & { spy: o.Spy<any[], void> };

export function FakeLogger(): LogSpyType {
    const logFn = o.spy();
    const logSpy: LogSpyType = {
        level: 'debug',
        child: () => logSpy,
        info: logFn,
        debug: logFn,
        trace: logFn,
        warn: logFn,
        error: logFn,
        fatal: logFn,

        spy: logFn,
    };
    return logSpy;
}

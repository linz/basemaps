import * as pino from 'pino';
import { Writable } from 'stream';

let currentLog: pino.Logger;

/**
 * Expose log type so functions that do not have direct access to pino have access to the log type
 */
export type LogType = pino.Logger;

/**
 * Encapsulate the logger so that it can be swapped out
 */
export const LogConfig = {
    /**
     * Getting access to the current log stream is hard,
     *
     * Pino uses Symbols for all its internal functions,
     * getting access to them without knowing the logger is a pino logger is difficult
     *
     * **Used for testing**
     * To allow overwriting of the .write() to get access to the output logs
     */
    getOutputStream(): Writable {
        // There are no types for pino.symbols
        const streamSym = (pino as any).symbols.streamSym;
        // there is no type for pino['Symbol(stream)']
        return LogConfig.get()[streamSym] as any;
    },

    /** Get the currently configured logger */
    get: (): pino.Logger => {
        if (currentLog == null) {
            currentLog = pino({ level: 'debug' });
        }
        return currentLog;
    },
    set: (log: pino.Logger): void => {
        currentLog = log;
    },
};

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
    /** Get the currently configured logger */
    get(): pino.Logger {
        if (currentLog == null) {
            currentLog = pino({ level: 'debug' });
        }
        return currentLog;
    },

    set(log: pino.Logger): void {
        currentLog = log;
    },

    /** Overwrite the logger with a new logger that outputs to the provided stream*/
    setOutputStream(stream: Writable): void {
        let level = 'debug';
        if (currentLog) {
            level = currentLog.level;
        }
        currentLog = pino({ level }, stream);
    },

    /** Disable the logger */
    disable(): void {
        LogConfig.get().level = 'silent';
    },
};

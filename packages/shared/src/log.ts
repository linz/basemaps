import pino from 'pino';
import { Writable } from 'stream';

export interface LogFunc {
    (msg: string): void;
    (obj: Record<string, unknown>, msg: string): void;
}

let currentLog: LogType;

/**
 * Expose log type so functions that do not have direct access to pino have access to the log type
 */
export interface LogType {
    level: string;
    trace: LogFunc;
    debug: LogFunc;
    info: LogFunc;
    warn: LogFunc;
    error: LogFunc;
    fatal: LogFunc;
    child: (obj: Record<string, unknown>) => LogType;
}
/**
 * Encapsulate the logger so that it can be swapped out
 */
export const LogConfig = {
    /** Get the currently configured logger */
    get(): LogType {
        if (currentLog == null) {
            currentLog = pino({ level: 'debug' });
        }
        return currentLog;
    },

    set(log: LogType): void {
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

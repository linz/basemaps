import pino from 'pino';
import { PrettyTransform } from 'pretty-json-log';

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

const defaultOpts = { level: 'debug' };
/**
 * Encapsulate the logger so that it can be swapped out
 */
export const LogConfig = {
  /** Get the currently configured logger */
  get(): LogType {
    if (currentLog == null) {
      currentLog = process.stdout.isTTY ? pino(defaultOpts, PrettyTransform.stream()) : pino(defaultOpts);
    }
    return currentLog;
  },

  set(log: LogType): void {
    currentLog = log;
  },

  /** Disable the logger */
  disable(): void {
    LogConfig.get().level = 'silent';
  },
};

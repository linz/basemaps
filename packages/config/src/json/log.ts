export interface LogFunc {
  (msg: string): void;
  (obj: Record<string, unknown>, msg: string): void;
}

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

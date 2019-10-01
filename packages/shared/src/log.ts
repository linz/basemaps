import * as pino from 'pino';

// Disable logging while jest is doing it's testing thing
const isEnabled = process.env['JEST_WORKER_ID'] == null;
export const Logger = pino({ level: 'debug', enabled: isEnabled });

import { LogConfig } from '@basemaps/shared';
import { lf } from '@linzjs/lambda';

import { main } from './handler.js';

export const handler = lf.handler(main, { tracePercent: 0, rejectOnError: true }, LogConfig.get());

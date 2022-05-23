import { lf } from '@linzjs/lambda';
import { LogConfig } from '@basemaps/shared';
import { Import } from './routes/import.js';

export const handler = lf.http(LogConfig.get());

handler.router.get('/v1/import', Import);

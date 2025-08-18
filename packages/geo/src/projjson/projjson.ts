import { PROJJSONDefinition } from 'proj4/dist/lib/core.js';

import { aktm2000 } from './aktm2000.js';
import { mscl2000 } from './mslc2000.js';

export const ProjJsons: Record<number, PROJJSONDefinition> = {
  3788: aktm2000,
  5479: mscl2000,
};

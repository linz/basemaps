import { PROJJSONDefinition } from 'proj4/dist/lib/core.js';

import { Aktm2000Json } from './aktm2000.js';
import { Citm2000Json } from './citm2000.js';
import { Mscl2000Json } from './mslc2000.js';
import { Nztm2000Json } from './nztm2000.js';

export const ProjJsons: Record<number, PROJJSONDefinition> = {
  [Aktm2000Json.id.code]: Aktm2000Json,
  [Mscl2000Json.id.code]: Mscl2000Json,
  [Nztm2000Json.id.code]: Nztm2000Json,
  [Citm2000Json.id.code]: Citm2000Json,
} as Record<number, PROJJSONDefinition>;

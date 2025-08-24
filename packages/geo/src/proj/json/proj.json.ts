import { PROJJSONDefinition } from 'proj4/dist/lib/core.js';

import { Mscl2000Json } from './ant/mslc2000.js';
import { Citm2000Json } from './nz/citm2000.js';
import { Nztm2000Json } from './nz/nztm2000.js';
import { Aitm2000Json } from './nzoi/aitm2000.js';
import { Aktm2000Json } from './nzoi/aktm2000.js';
import { Catm2000Json } from './nzoi/catm2000.js';
import { Ritm2000Json } from './nzoi/ritm2000.js';

export const ProjJsons: Record<number, PROJJSONDefinition> = {
  // ant
  [Mscl2000Json.id.code]: Mscl2000Json,
  // nz
  [Citm2000Json.id.code]: Citm2000Json,
  [Nztm2000Json.id.code]: Nztm2000Json,
  // nzoi
  [Aitm2000Json.id.code]: Aitm2000Json,
  [Aktm2000Json.id.code]: Aktm2000Json,
  [Catm2000Json.id.code]: Catm2000Json,
  [Ritm2000Json.id.code]: Ritm2000Json,
} as Record<number, PROJJSONDefinition>;

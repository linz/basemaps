import * as proj4 from 'proj4';
import { NZGD2000 } from './nzgd2000';

proj4.defs('NZGD2000', NZGD2000);
proj4.defs('2193', NZGD2000);

export const Proj2193 = proj4('2193');

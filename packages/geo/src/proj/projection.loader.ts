import { PROJJSONDefinition } from 'proj4/dist/lib/core.js';

import { Epsg } from '../epsg.js';
import { ProjJsons } from './json/proj.json.js';
import { Projection } from './projection.js';
import { UtmZone } from './json/utmzone.js';

declare const fetch: (r: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

export class ProjectionLoader {
  // Exposed for testing
  static _fetch = fetch;

  /**
   * Ensure that a projection EPSG code is available for use in Proj4js
   *
   * If its not already loaded, lookup definition from spatialreference.org
   * @param code
   */
  static async load(code: number): Promise<Epsg> {
    if (Projection.tryGet(code) != null) return Epsg.get(code);

    let projJson: PROJJSONDefinition;

    if (UtmZone.isUTMZoneCode(code)) {
      // Generate the ProjJSON dynamically
      projJson = UtmZone.generate(code);
    } else {
      // Grab the projJSON locally. Otherwise, fetch it
      projJson = ProjJsons[code] ?? (await this.fetchProjJson(code));
    }

    let epsg = Epsg.tryGet(code);
    if (epsg == null) epsg = new Epsg(code);

    Projection.define(epsg, projJson);
    return epsg;
  }

  /**
   * Fetches a ProjJSON definition via the spatialnreference.org API.
   *
   * @param code - The code for which to lookup the ProjJSON definition
   * @returns a PROJJSONDefinition object
   */
  static async fetchProjJson(code: number): Promise<PROJJSONDefinition> {
    const url = `https://spatialreference.org/ref/epsg/${code}/projjson.json`;

    const res = await this._fetch(url);
    if (!res.ok) throw new Error('Failed to load projection information for: ' + code);

    const json = await res.json();
    return json as PROJJSONDefinition;
  }
}

import { PROJJSONDefinition } from 'proj4/dist/lib/core.js';

import { Epsg } from '../epsg.js';
import { ProjJsons } from './json/proj.json.js';
import { Projection } from './projection.js';
import { UtmZone } from './utmzone.js';

declare const fetch: (r: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

export class ProjectionLoader {
  // Exposed for testing
  static _fetch = fetch;

  /**
   * Initialises an Epsg instance for the given code and ensures that
   * a corresponding Projection instance is available.
   *
   * @param code - The code for which to initialise an Epsg and Projection instance.
   * @returns an Epsg instance
   */
  static async load(code: number): Promise<Epsg> {
    if (Projection.tryGet(code) != null) return Epsg.get(code);

    let projJson: PROJJSONDefinition;

    if (UtmZone.isUTMZoneCode(code)) {
      // Generate the ProjJSON dynamically
      projJson = UtmZone.generateProjJson(code);
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
   * Fetches a ProjJSON definition via the spatialreference.org API.
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

import { Epsg } from '../epsg.js';
import { ProjJsons } from '../projjson/projjson.js';
import { Projection } from './projection.js';

declare const fetch: (r: string) => Promise<{ ok: boolean; text: () => Promise<string> }>;

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

    const projJson = ProjJsons[code];
    if (projJson != null) {
      let epsg = Epsg.tryGet(code);
      if (epsg == null) epsg = new Epsg(code);

      Projection.define(epsg, projJson);
      return epsg;
    }

    const url = `https://spatialreference.org/ref/epsg/${code}/ogcwkt/`;

    const res = await this._fetch(url);
    if (!res.ok) throw new Error('Failed to load projection information for:' + code);

    let epsg = Epsg.tryGet(code);
    if (epsg == null) epsg = new Epsg(code);

    const text = await res.text();
    Projection.define(epsg, text);
    return epsg;
  }
}

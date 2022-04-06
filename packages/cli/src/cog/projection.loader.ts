import { Epsg } from '@basemaps/geo';
import { Projection } from '@basemaps/shared';
import fetch from 'node-fetch';

export class ProjectionLoader {
  // Exposed for testing
  static _fetch = fetch;

  /**
   * Ensure that a projection EPSG code is avialable for use in Proj4js
   *
   * If its not already loaded, lookup definition from spatialreference.org
   * @param code
   */
  static async load(code: number): Promise<Epsg> {
    console.log(Epsg.tryGet(code));
    if (Projection.tryGet(code) != null) return Epsg.get(code);
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

import { Epsg } from '@basemaps/geo';
import { Projection } from '@basemaps/shared';
import fetch from 'node-fetch';

export const ProjectionLoader = {
  fetch: fetch,
  async load(code: number): Promise<Epsg> {
    if (Projection.tryGet(code) != null) return Epsg.get(code);
    const url = `https://spatialreference.org/ref/epsg/${code}/ogcwkt/`;

    const res = await this.fetch(url);
    if (!res.ok) throw new Error('Failed to load projection information for:' + code);

    let epsg = Epsg.tryGet(code);
    if (epsg == null) epsg = new Epsg(code);

    const text = await res.text();
    Projection.define(epsg, text);
    return epsg;
  },
};

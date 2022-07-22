import { fsa } from '@chunkd/fs';
import { Cotar } from '@cotar/core';

export class AssetProvider {
  /**
   * Assets can be ready from the following locations.
   *
   * /home/blacha/config/build/assets # Local File
   * /home/blacha/config/build/assets.tar.co # Local Cotar
   * s3://linz-baesmaps/assets/ # Remote location
   * s3://linz-basemaps/assets/assets-b4ff211a.tar.co # Remote Cotar
   */

  /** Path of the assets location */
  path: string;
  _cotar: Promise<Cotar | null>;

  constructor(path?: string) {
    if (path) this.path = path;
  }

  async get(fileName: string): Promise<Buffer | null> {
    // get assets file from cotar
    if (this.path.endsWith('.tar.co')) return this.getFromCotar(fileName);

    // get assets file for directory

    try {
      const filePath = fsa.join(this.path, fileName);
      const buf = await fsa.read(filePath);
      return buf;
    } catch (e: any) {
      if (e.code === 404) return null;
      throw e;
    }
  }

  _getCotar(): Promise<Cotar | null> {
    if (this._cotar == null) {
      const source = fsa.source(this.path);
      this._cotar = Cotar.fromTar(source);
    }
    return this._cotar;
  }

  async getFromCotar(fileName: string): Promise<Buffer | null> {
    const cotar = await this._getCotar();
    if (cotar == null) return null; // Unable to find cotar from the path.
    const data = await cotar.get(fileName);
    return data ? Buffer.from(data) : data;
  }
}

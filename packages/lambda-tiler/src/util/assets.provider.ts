import { Config } from '@basemaps/config';
import { fsa } from '@chunkd/fs';
import { LambdaHttpResponse, LambdaHttpRequest, HttpHeader } from '@linzjs/lambda';
import { isGzip } from './cotar.serve.js';
import { Etag } from './etag.js';
import { NotFound, NotModified } from './response.js';
import { CoSources } from './source.cache.js';

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
  path: string | undefined;

  set(path?: string): void {
    this.path = path;
  }

  async get(fileName: string): Promise<Buffer | null> {
    if (this.path == null) return null;
    // get assets file from cotar
    if (this.path.endsWith('.tar.co')) return await this.getFromCotar(this.path, fileName);

    // get assets file for directory
    try {
      const filePath = fsa.join(this.path, fileName);
      return await fsa.read(filePath);
    } catch (e: any) {
      if (e.code === 404) return null;
      throw e;
    }
  }

  async getFromCotar(path: string, fileName: string): Promise<Buffer | null> {
    const cotar = await CoSources.getCotar(path);
    const data = await cotar.get(fileName);
    return data ? Buffer.from(data) : data;
  }

  /**
   *  Load a assets from local path or cotar returning the file back as a LambdaResponse
   *
   * This will also set two headers
   * - Content-Encoding if the file starts with gzip magic
   * - Content-Type from the parameter contentType
   */
  async serve(req: LambdaHttpRequest, file: string, contentType: string): Promise<LambdaHttpResponse> {
    const config = req.query.get('config');
    if (config) {
      const configBundle = await Config.ConfigBundle.get(config);
      if (configBundle == null) return NotFound();
      this.set(configBundle.assets);
    }

    const buf = await assetProvider.get(file);
    if (buf == null) return NotFound();
    const cacheKey = Etag.key(buf);
    if (Etag.isNotModified(req, cacheKey)) return NotModified();

    const response = LambdaHttpResponse.ok().buffer(buf, contentType);
    response.header(HttpHeader.ETag, cacheKey);
    response.header(HttpHeader.CacheControl, 'public, max-age=604800, stale-while-revalidate=86400');
    if (isGzip(buf)) response.header(HttpHeader.ContentEncoding, 'gzip');
    return response;
  }
}

export const assetProvider = new AssetProvider();

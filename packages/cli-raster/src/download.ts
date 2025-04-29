import { extname } from 'node:path';

import { sha256base58 } from '@basemaps/config';
import { fsa, LogType } from '@basemaps/shared';
import pLimit, { LimitFunction } from 'p-limit';

import { HashTransform } from './hash.stream.js';

export interface SourceFile {
  /** Source location */
  url: URL;
  /** List of items that need the source */
  items: string[];
  /** Location to the local file */
  asset?: Promise<URL>;
  /** Number of bytes in the file */
  size?: number;
  /** multihash of the file if it exists */
  hash?: string;
}
/**
 * Store assets used for creating COGs, (Tiffs, Cutlines) etc in a temporary location
 *
 * While also sharing them between multiple COG creation processes saving redownloading the files when they are needed
 * for multiple output COGS
 */
export class SourceDownloader {
  /** Limit the concurrency of the downloads @default 10 */
  Q: LimitFunction;
  /** Mapping of source location to target location */
  items: Map<string, SourceFile>;
  /** Local cache location */
  cachePath: URL;

  /**
   * Unique set of hosts eg "s3://linz-basemaps",
   * This has to be strings as each instance of a URL is unique.
   */
  hosts: Map<string, URL> = new Map();
  constructor(cachePath: URL) {
    this.cachePath = cachePath;
    this.Q = pLimit(10);
    this.items = new Map<string, SourceFile>();
  }

  /** Register that a item needs a specific source file for processing */
  register(url: URL, itemId: string): void {
    const assets: SourceFile = this.items.get(url.href) ?? { items: [], url };
    assets.items.push(itemId);
    this.items.set(url.href, assets);
    if (url.protocol !== 'file:') {
      const host = new URL(url.href);
      host.pathname = '/'; // remove the file path;
      this.hosts.set(host.href, url);
    }
  }

  /** Once a item is done with a asset clean it up if no other items need it */
  async done(url: URL, itemId: string, logger: LogType): Promise<boolean> {
    const asset = this.items.get(url.href);
    if (asset == null) throw new Error('Asset was not registered to be downloaded: ' + url.href);

    // Remove the itemId
    asset.items = asset.items.filter((f) => f !== itemId);
    if (asset.items.length > 0) return false;
    if (asset.asset == null) return false;
    // No more items need this asset, clean it up
    const targetFile = await asset.asset;
    logger.debug({ source: asset.url, target: targetFile }, 'Cog:Source:Cleanup');
    await fsa.delete(targetFile);
    return true;
  }

  /**
   * Get the local location of a remote asset
   *
   * This will start downloading the file into the temporary location
   */
  get(url: URL, logger: LogType): Promise<URL> {
    const asset = this.items.get(url.href);
    if (asset == null) throw new Error('Asset was not registered to be downloaded: ' + url.href);
    if (asset.asset) return asset.asset;

    asset.asset = this._downloadFile(asset, logger);
    return asset.asset;
  }

  _checked = new Map<string, Promise<unknown>>();
  /** Validate that the host can be read from before attempting to stream files */
  _checkHost(url: URL): Promise<unknown> {
    if (url.protocol === 'file:') return Promise.resolve();
    const host = url.hostname;
    let ret = this._checked.get(host);
    if (ret) return ret;
    ret = fsa.head(url) as Promise<unknown>;
    this._checked.set(host, ret);
    return ret;
  }

  /**
   * Download a file into a hashed target location, using @see {this.Q} to manage concurrency of downloads
   *
   * Pattern `/${this.cachePath}/source/${sha256base58(href)}`
   * @example
   * ```typescript
   * "/tmp/01H01JMN98AC36VVPNCYGQ8D5X/source/GnBQfpFe8QBTzJgHP9fXABBZR9xVEmPo87Zcec9n177S.tiff"
   * ```
   */
  _downloadFile(asset: SourceFile, logger: LogType): Promise<URL> {
    return this.Q(async () => {
      const newFileName = sha256base58(Buffer.from(asset.url.href)) + extname(asset.url.href);
      const targetFile = new URL(`source/${newFileName}`, this.cachePath);

      await this._checkHost(asset.url);
      logger.trace({ source: asset.url, target: targetFile }, 'Cog:Source:Download');
      const hashStream = fsa.readStream(asset.url).pipe(new HashTransform('sha256'));
      const startTime = performance.now();
      await fsa.write(targetFile, hashStream);
      const duration = performance.now() - startTime;

      asset.size = hashStream.size;
      asset.hash = hashStream.multihash;
      const stat = await fsa.head(targetFile);
      logger.info(
        {
          source: asset.url,
          target: targetFile,
          items: asset.items,
          size: stat?.size,
          hash: asset.hash,
          assetSize: asset.size,
          duration,
        },
        'Cog:Source:Download:Done',
      );
      return targetFile;
    });
  }
}

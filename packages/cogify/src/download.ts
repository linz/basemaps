import { sha256base58 } from '@basemaps/config';
import { LogType, fsa } from '@basemaps/shared';
import pLimit, { LimitFunction } from 'p-limit';
import { extname } from 'path';

export interface SourceFile {
  /** Source location */
  href: string;
  /** List of items that need the source */
  items: string[];
  /**  */
  asset?: Promise<string>;
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
  cachePath: string;
  constructor(cachePath: string) {
    this.cachePath = cachePath;
    this.Q = pLimit(10);
    this.items = new Map<string, SourceFile>();
  }

  /** Register that a item needs a specific source file for processing */
  register(href: string, itemId: string): void {
    const assets: SourceFile = this.items.get(href) ?? { items: [], href };
    assets.items.push(itemId);
    this.items.set(href, assets);
  }

  /** Once a item is done with a asset clean it up if no other items need it */
  async done(href: string, itemId: string, logger: LogType): Promise<void> {
    const asset = this.items.get(href);
    if (asset == null) throw new Error('Asset was not registered to be downloaded: ' + href);

    // Remove the itemId
    asset.items = asset.items.filter((f) => f !== itemId);
    if (asset.items.length > 0) return;
    if (asset.asset == null) return;
    // No more items need this asset, clean it up
    const targetFile = await asset.asset;
    logger.info({ source: asset.href, target: targetFile }, 'Cog:Source:Cleanup');
    await fsa.delete(targetFile);
  }

  /**
   * Get the local location of a remote asset
   *
   * This will start downloading the file into the temporary location
   */
  get(href: string, logger: LogType): Promise<string> {
    const asset = this.items.get(href);
    if (asset == null) throw new Error('Asset was not registered to be downloaded: ' + href);
    if (asset.asset) return asset.asset;

    asset.asset = this._downloadFile(asset, logger);
    return asset.asset;
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
  _downloadFile(asset: SourceFile, logger: LogType): Promise<string> {
    return this.Q(async () => {
      const newFileName = sha256base58(Buffer.from(asset.href)) + extname(asset.href);
      const targetFile = fsa.joinAll(this.cachePath, 'source', newFileName);

      logger.debug({ source: asset.href, target: targetFile }, 'Cog:Source:Download');
      const startTime = performance.now();
      await fsa.write(targetFile, fsa.stream(asset.href));
      const duration = performance.now() - startTime;
      logger.info({ source: asset.href, target: targetFile, items: asset.items, duration }, 'Cog:Source:Download:Done');
      return targetFile;
    });
  }
}

import { ConfigLayer, ConfigTileSetRaster } from '@basemaps/config';
import { LogType } from '@basemaps/shared';
import { Github, owner, repo } from './github.js';

export interface ImageryUrl {
  tileMatrix: string;
  url: string;
}

export class MakeCogGithub extends Github {
  imagery: string;
  constructor(imagery: string, logger: LogType) {
    super(logger);
    this.imagery = imagery;
  }

  /**
   * Get the master aerial tileset config from the basemaps config repo
   */
  async getTileSetConfig(): Promise<ConfigTileSetRaster> {
    this.logger.info({ imagery: this.imagery }, 'GitHub: Get the master TileSet config file');
    const path = 'config/tileset/aerial.json';
    const response = await this.octokit.rest.repos.getContent({ owner, repo, path });
    if (!this.isOk(response.status)) throw new Error('Failed to get aerial TileSet config.');
    if ('content' in response.data) {
      return JSON.parse(Buffer.from(response.data.content, 'base64').toString());
    } else {
      throw new Error('Unable to find the content.');
    }
  }

  /**
   * Prepare and create pull request for the aerial tileset config
   */
  async createTileSetPullRequest(
    layer: ConfigLayer,
    urls: ImageryUrl[],
    jira: string | undefined,
  ): Promise<number | undefined> {
    // Prepare new aerial tileset config
    const tileSet = await this.getTileSetConfig();
    const newTileSet = await this.prepareTileSetConfig(layer, tileSet);

    // skip pull request if not an urban or rural imagery
    if (newTileSet == null) return;

    const branch = `feat/config-${this.imagery}`;
    const ref = `refs/heads/${branch}`;
    // Create branch first
    const existing = await this.getBranch(branch);
    if (existing == null) await this.createBranch(branch, ref);

    // Create blob for the tileset config
    const content = JSON.stringify(newTileSet, null, 2) + '\n'; // Add a new line at end to match the prettier.
    const path = `config/tileset/aerial.json`;
    const blob = await this.createBlobs(content, path);

    // commit blobs to tree
    const message = `feat(imagery): Add imagery ${this.imagery} config file.`;
    await this.commit(branch, ref, [blob], message);
    // Create imagery import pull request
    const title = `feat(aerial): Config imagery ${this.imagery} into Aerial Map. ${jira ? jira : ''}`;
    // Prepare pull request body
    let body = `Imagery imported for ${this.imagery}, please use the following QA url once the aws job finished.\n\n`;
    for (const url of urls) body += `Individual Imagery ${url.tileMatrix}: ${url.url}\n\n`;
    const prNumber = await this.createPullRequest(branch, ref, title, body, true);
    return prNumber;
  }

  /**
   * Prepare aerial tileSet config json
   */
  async prepareTileSetConfig(
    layer: ConfigLayer,
    tileSet: ConfigTileSetRaster,
  ): Promise<ConfigTileSetRaster | undefined> {
    // Set layer zoom level and add to latest order
    if (layer.name.includes('rural')) {
      layer.minZoom = 13;
      layer.category = 'Rural Aerial Photos';
      for (let i = 0; i < tileSet.layers.length; i++) {
        // Add new layer at the end of rural
        if (tileSet.layers[i].minZoom === 14) {
          tileSet.layers.splice(i, 0, layer);
          break;
        }
      }
    } else if (layer.name.includes('urban')) {
      layer.minZoom = 14;
      layer.category = 'Urban Aerial Photos';
      // Add new layer at the end of urban
      for (let i = tileSet.layers.length - 1; i >= 0; i--) {
        if (tileSet.layers[i].name.includes('urban')) {
          tileSet.layers.splice(i + 1, 0, layer);
          break;
        }
      }
    } else if (layer.name.includes('satellite')) {
      layer.minZoom = 5;
      layer.category = 'Satellite Imagery';
      // Add new layer at the end of satellite
      for (let i = tileSet.layers.length - 1; i >= 0; i--) {
        if (tileSet.layers[i].name.includes('satellite')) {
          tileSet.layers.splice(i + 1, 0, layer);
          break;
        }
      }
    } else {
      // Add new layer at the bottom
      layer.minZoom = 32;
      layer.category = 'New Aerial Photos';
      tileSet.layers.push(layer);
    }

    return tileSet;
  }
}

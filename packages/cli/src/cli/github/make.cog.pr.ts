import { ConfigLayer, ConfigTileSetRaster } from '@basemaps/config';
import { LogType } from '@basemaps/shared';
import { Category } from '../cogify/action.make.cog.pr.js';
import { Github, owner, repo } from './github.js';

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
    jira: string | undefined,
    category: Category,
  ): Promise<number | undefined> {
    // Prepare new aerial tileset config
    const tileSet = await this.getTileSetConfig();
    const newTileSet = await this.prepareTileSetConfig(layer, tileSet, category);

    // skip pull request if not an urban or rural imagery
    if (newTileSet == null) return;

    const branch = `feat/config-${this.imagery}`;
    const ref = `heads/${branch}`;
    // Create branch first
    let sha = await this.getBranch(ref);
    if (sha == null) sha = await this.createBranch(branch, ref);

    // Create blob for the tileset config
    const content = JSON.stringify(newTileSet, null, 2) + '\n'; // Add a new line at end to match the prettier.
    const path = `config/tileset/aerial.json`;
    const blob = await this.createBlobs(content, path);

    // commit blobs to tree
    const message = `feat(imagery): Add imagery ${this.imagery} config file.`;
    await this.commit(branch, ref, [blob], message, sha);
    // Create imagery import pull request
    const title = `feat(aerial): Config imagery ${this.imagery} into Aerial Map. ${jira ? jira : ''}`;
    const prNumber = await this.createPullRequest(branch, title, false);
    return prNumber;
  }

  /**
   * Prepare aerial tileSet config json
   */
  async prepareTileSetConfig(
    layer: ConfigLayer,
    tileSet: ConfigTileSetRaster,
    category: Category,
  ): Promise<ConfigTileSetRaster | undefined> {
    // Set layer zoom level and add to latest order
    if (category === Category.Rural) {
      layer.minZoom = 13;
      layer.category = Category.Rural;
      for (let i = 0; i < tileSet.layers.length; i++) {
        // Add new layer at the end of rural
        if (tileSet.layers[i].category === Category.Rural && tileSet.layers[i].minZoom === 14) {
          // Find first valid Urban and insert new record above that.
          tileSet.layers.splice(i, 0, layer);
          break;
        }
      }
    } else if (category === Category.Urban) {
      layer.minZoom = 14;
      layer.category = Category.Urban;
      // Add new layer at the end of urban
      for (let i = tileSet.layers.length - 1; i >= 0; i--) {
        if (tileSet.layers[i].category === Category.Urban && tileSet.minZoom === 14) {
          // Find first Urban from the bottom up and insert the record below that.
          tileSet.layers.splice(i + 1, 0, layer);
          break;
        }
      }
    } else if (category === Category.Satellite) {
      layer.minZoom = 5;
      layer.category = Category.Satellite;
      // Add new layer at the end of satellite
      for (let i = tileSet.layers.length - 1; i >= 0; i--) {
        // Find first Satellite imagery from bottom up and insert the record below that.
        if (tileSet.layers[i].category === Category.Satellite) {
          tileSet.layers.splice(i + 1, 0, layer);
          break;
        }
      }
    } else {
      // Add new layer at the bottom
      layer.category = Category.Other;
      tileSet.layers.push(layer);
    }

    return tileSet;
  }
}

import { ConfigLayer, ConfigTileSetRaster } from '@basemaps/config';
import { LogType } from '@basemaps/shared';
import { Category, DefaultCategorySetting } from '../cogify/action.make.cog.pr.js';
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
   * Add new layer at the bottom of related category
   */
  setDefaultConfig(layer: ConfigLayer, category: Category): ConfigLayer {
    for (const setting of DefaultCategorySetting) {
      if (category === setting.category) {
        layer.category = setting.category;
        if (setting.minZoom) layer.minZoom = setting.minZoom;
        if (setting.disabled) layer.disabled = setting.disabled;
      }
    }
    return layer;
  }

  /**
   * Add new layer at the bottom of related category
   */
  addLayer(layer: ConfigLayer, tileSet: ConfigTileSetRaster, category: Category): ConfigTileSetRaster {
    this.setDefaultConfig(layer, category);
    for (let i = tileSet.layers.length - 1; i >= 0; i--) {
      // Add new layer at the end of category
      if (tileSet.layers[i].category === category) {
        // Find first valid category and insert new record above that.
        tileSet.layers.splice(i + 1, 0, layer);
        break;
      }
    }
    return tileSet;
  }

  /**
   * Prepare aerial tileSet config json
   */
  async prepareTileSetConfig(
    layer: ConfigLayer,
    tileSet: ConfigTileSetRaster,
    category: Category,
  ): Promise<ConfigTileSetRaster | undefined> {
    // Reprocess existing layer
    for (let i = 0; i < tileSet.layers.length; i++) {
      if (tileSet.layers[i].name === layer.name) {
        tileSet.layers[i] = layer;
        return tileSet;
      }
    }

    // Set layer zoom level and add to latest order
    if (category === Category.Rural) {
      this.setDefaultConfig(layer, category);
      for (let i = 0; i < tileSet.layers.length; i++) {
        // Add new layer above the first Urban
        if (tileSet.layers[i].category === Category.Urban) {
          // Find first valid Urban and insert new record above that.
          tileSet.layers.splice(i, 0, layer);
          break;
        }
      }
    } else if (category === Category.Other) {
      // Add new layer at the bottom
      this.setDefaultConfig(layer, category);
      tileSet.layers.push(layer);
    } else {
      this.addLayer(layer, tileSet, category);
    }

    return tileSet;
  }
}

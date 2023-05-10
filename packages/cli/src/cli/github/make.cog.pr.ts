import { ConfigLayer, ConfigTileSetRaster, ConfigTileSetVector } from '@basemaps/config';
import { LogType, fsa } from '@basemaps/shared';
import { Category, DefaultCategorySetting } from '../cogify/action.make.cog.pr.js';
import { Github } from './github.js';

export class MakeCogGithub extends Github {
  imagery: string;
  constructor(imagery: string, repo: string, logger: LogType) {
    super(repo, logger);
    this.imagery = imagery;
  }

  /**
   * Prepare and create pull request for the aerial tileset config
   */
  async updateRasterTileSet(filename: string, layer: ConfigLayer, category: Category): Promise<void> {
    const branch = `feat/bot-config-raster-${this.imagery}`;

    // Clone the basemaps-config repo and checkout branch
    this.clone();
    this.getBranch(branch);

    // Prepare new aerial tileset config
    this.logger.info({ imagery: this.imagery }, 'GitHub: Get the master TileSet config file');
    const path = `${this.repoName}/config/tileset/${filename}.json`;
    const tileSet = await fsa.readJson<ConfigTileSetRaster>(path);
    const newTileSet = await this.prepareRasterTileSetConfig(layer, tileSet, category);

    // skip pull request if not an urban or rural imagery
    if (newTileSet == null) return;
    await fsa.write(path, JSON.stringify(newTileSet, null, 2));

    // Commit and push the changes
    const message = `config(raster): Add imagery ${this.imagery} to ${filename} config file.`;
    this.commit(message);
    this.push();
  }

  /**
   * Set the default setting for the category
   */
  setDefaultConfig(layer: ConfigLayer, category: Category): ConfigLayer {
    layer.category = category;
    const defaultSetting = DefaultCategorySetting[category];
    if (defaultSetting) {
      if (defaultSetting.minZoom != null && layer.minZoom != null) layer.minZoom = defaultSetting.minZoom;
      if (defaultSetting.minZoom != null && layer.minZoom != null) layer.disabled = defaultSetting.disabled;
    }

    return layer;
  }

  /**
   * Add new layer at the bottom of related category
   */
  addLayer(layer: ConfigLayer, tileSet: ConfigTileSetRaster, category: Category): ConfigTileSetRaster {
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
   * Prepare raster tileSet config json
   */
  async prepareRasterTileSetConfig(
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

    // Set default Config if not existing layer
    this.setDefaultConfig(layer, category);

    // Set layer zoom level and add to latest order
    if (category === Category.Rural) {
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
      tileSet.layers.push(layer);
    } else {
      this.addLayer(layer, tileSet, category);
    }

    return tileSet;
  }

  /**
   * Prepare and create pull request for the aerial tileset config
   */
  async updateVectorTileSet(filename: string, layer: ConfigLayer): Promise<void> {
    const branch = `feat/bot-config-vector-${this.imagery}`;

    // Clone the basemaps-config repo and checkout branch
    this.clone();
    this.getBranch(branch);

    // Prepare new aerial tileset config
    this.logger.info({ imagery: this.imagery }, 'GitHub: Get the master TileSet config file');
    const path = `${this.repoName}/config/tileset/${filename}.json`;
    const tileSet = await fsa.readJson<ConfigTileSetVector>(path);
    const newTileSet = await this.prepareVectorTileSetConfig(layer, tileSet);

    // skip pull request if not an urban or rural imagery
    if (newTileSet == null) return;
    await fsa.write(path, JSON.stringify(newTileSet, null, 2));

    // Commit and push the changes
    const message = `config(vector): Update the ${this.imagery} to ${filename} config file.`;
    this.commit(message);
    this.push();
  }

  /**
   * Prepare raster tileSet config json
   */
  async prepareVectorTileSetConfig(layer: ConfigLayer, tileSet: ConfigTileSetVector): Promise<ConfigTileSetVector> {
    // Reprocess existing layer
    for (let i = 0; i < tileSet.layers.length; i++) {
      if (tileSet.layers[i].name === layer.name) {
        tileSet.layers[i] = layer;
        return tileSet;
      }
    }
    return tileSet;
  }
}

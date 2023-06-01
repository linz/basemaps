import { ConfigLayer, standardizeLayerName } from '@basemaps/config';
import { LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { MakeCogGithub } from '../github/make.cog.pr.js';

export enum Category {
  Urban = 'Urban Aerial Photos',
  Rural = 'Rural Aerial Photos',
  Satellite = 'Satellite Imagery',
  Event = 'Event',
  Other = 'New Aerial Photos',
}

export interface CategorySetting {
  minZoom?: number;
  disabled?: boolean;
}

export const DefaultCategorySetting: Record<Category, CategorySetting> = {
  [Category.Urban]: { minZoom: 14 },
  [Category.Rural]: { minZoom: 13 },
  [Category.Satellite]: { minZoom: 5 },
  [Category.Event]: { disabled: true },
  [Category.Other]: { disabled: true },
};

export function parseCategory(category: string): Category {
  const c = category.toLocaleLowerCase();
  if (c.includes('urban')) return Category.Urban;
  else if (c.includes('rural')) return Category.Rural;
  else if (c.includes('satellite')) return Category.Satellite;
  else return Category.Other;
}

export class CommandCogPullRequest extends CommandLineAction {
  private layer: CommandLineStringParameter;
  private category: CommandLineStringParameter;
  private repository: CommandLineStringParameter;
  private disabled: CommandLineFlagParameter;
  private vector: CommandLineFlagParameter;

  public constructor() {
    super({
      actionName: 'cog-pr',
      summary: 'create a github pull request for the import cog workflow',
      documentation: 'Given a output of make-cog command and create pull request for the imagery config.',
    });
  }

  protected onDefineParameters(): void {
    this.layer = this.defineStringParameter({
      argumentName: 'LAYER',
      parameterLongName: '--layer',
      description: 'Input config layer',
      required: false,
    });
    this.category = this.defineStringParameter({
      argumentName: 'CATEGORY',
      parameterLongName: '--category',
      description: 'New Imagery Category, like Rural Aerial Photos, Urban Aerial Photos, Satellite Imagery',
      required: false,
    });
    this.repository = this.defineStringParameter({
      argumentName: 'REPOSITORY',
      parameterLongName: '--repository',
      description: 'Github repository reference',
      defaultValue: 'linz/basemaps-config',
      required: false,
    });
    this.disabled = this.defineFlagParameter({
      parameterLongName: '--disabled',
      description: 'Disable the layer in the config',
      required: false,
    });
    this.vector = this.defineFlagParameter({
      parameterLongName: '--vector',
      description: 'Commit changes for vector map',
      required: false,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const layerStr = this.layer.value;
    const category = this.category.value ? parseCategory(this.category.value) : Category.Other;
    const repo = this.repository.value ?? this.repository.defaultValue;
    if (layerStr == null) throw new Error('Please provide a valid input layer and urls');
    if (repo == null) throw new Error('Please provide a repository');
    let layer: ConfigLayer;
    try {
      layer = JSON.parse(layerStr);
    } catch {
      throw new Error('Please provide a valid input layer');
    }

    //Make sure the imagery name is standardized before update the config
    layer.name = standardizeLayerName(layer.name);

    const git = new MakeCogGithub(layer.name, repo, logger);
    if (this.disabled.value) layer.disabled = true;
    if (this.vector.value) await git.updateVectorTileSet('topographic', layer);
    else await git.updateRasterTileSet('aerial', layer, category);
  }
}

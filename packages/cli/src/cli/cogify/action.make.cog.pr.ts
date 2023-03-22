import { ConfigLayer } from '@basemaps/config';
import { fsa, LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineFlagParameter, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { owner, repo } from '../github/github.js';
import { MakeCogGithub } from '../github/make.cog.pr.js';

export enum Category {
  Urban = 'Urban Aerial Photos',
  Rural = 'Rural Aerial Photos',
  Satellite = 'Satellite Imagery',
  Event = 'Event',
  Other = 'New Aerial Photos',
}

export const DefaultMinZoom = {
  [Category.Satellite]: 5,
  [Category.Rural]: 13,
  [Category.Urban]: 14,
  [Category.Other]: 32,
  [Category.Event]: 32,
};

export const DefaultDisabled = {
  [Category.Satellite]: false,
  [Category.Rural]: false,
  [Category.Urban]: false,
  [Category.Other]: true,
  [Category.Event]: true,
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
  private output: CommandLineStringParameter;
  private jira: CommandLineStringParameter;
  private category: CommandLineStringParameter;
  private disabled: CommandLineFlagParameter;

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
      required: true,
    });
    this.output = this.defineStringParameter({
      argumentName: 'OUTPUT',
      parameterLongName: '--output',
      description: 'Output the pull request url',
      required: false,
    });
    this.jira = this.defineStringParameter({
      argumentName: 'JIRA',
      parameterLongName: '--jira',
      description: 'Jira number to add to pull request title',
      required: false,
    });
    this.category = this.defineStringParameter({
      argumentName: 'CATEGORY',
      parameterLongName: '--category',
      description: 'New Imagery Category, like Rural Aerial Photos, Urban Aerial Photos, Satellite Imagery',
      required: false,
    });
    this.disabled = this.defineFlagParameter({
      parameterLongName: '--disabled',
      description: 'Disable the layer in the config',
      required: false,
    });
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const layerStr = this.layer.value;
    const category = this.category.value ? parseCategory(this.category.value) : Category.Other;
    if (layerStr == null) throw new Error('Please provide a valid input layer and urls');
    let layer: ConfigLayer;
    try {
      layer = JSON.parse(layerStr);
    } catch {
      throw new Error('Please provide a valid input layer');
    }

    const git = new MakeCogGithub(layer.name, logger);
    if (this.disabled.value) layer.disabled = true;
    const prNumber = await git.createTileSetPullRequest(layer, this.jira.value, category);

    const output = this.output.value;
    if (output) {
      const prUrl = `https://github.com/${owner}/${repo}/pull/${prNumber}`;
      fsa.write(output, prUrl);
    }
  }
}

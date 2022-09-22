import { ConfigLayer } from '@basemaps/config';
import { fsa, LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { ImageryUrl, MakeCogGithub } from '../github/make.cog.pr';

export class CommandCogPullRequest extends CommandLineAction {
  private layer: CommandLineStringParameter;
  private urls: CommandLineStringParameter;
  private output: CommandLineStringParameter;
  private jira: CommandLineStringParameter;

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
    this.urls = this.defineStringParameter({
      argumentName: 'URLS',
      parameterLongName: '--urls',
      description: 'Input imagery urls',
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
  }

  async onExecute(): Promise<void> {
    const logger = LogConfig.get();
    const layerStr = this.layer.value;
    const urlsStr = this.urls.value;
    if (layerStr == null || urlsStr == null) throw new Error('Please provide a valid input layer and urls');
    let layer: ConfigLayer;
    let urls: ImageryUrl[];
    try {
      layer = JSON.parse(layerStr);
      urls = JSON.parse(urlsStr);
    } catch {
      throw new Error('Please provide a valid input layer and urls');
    }

    const git = new MakeCogGithub(layer.name, logger);
    await git.createTileSetPullRequest(layer, urls, this.jira.value);
  }
}

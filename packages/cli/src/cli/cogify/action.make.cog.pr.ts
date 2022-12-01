import { ConfigLayer } from '@basemaps/config';
import { fsa, LogConfig } from '@basemaps/shared';
import { CommandLineAction, CommandLineStringParameter } from '@rushstack/ts-command-line';
import { owner, repo } from '../github/github.js';
import { MakeCogGithub } from '../github/make.cog.pr.js';

export class CommandCogPullRequest extends CommandLineAction {
  private layer: CommandLineStringParameter;
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
    if (layerStr == null) throw new Error('Please provide a valid input layer and urls');
    let layer: ConfigLayer;
    try {
      layer = JSON.parse(layerStr);
    } catch {
      throw new Error('Please provide a valid input layer');
    }

    const git = new MakeCogGithub(layer.name, logger);
    const prNumber = await git.createTileSetPullRequest(layer, this.jira.value);

    const output = this.output.value;
    if (output) {
      const prUrl = `https://github.com/${owner}/${repo}/pull/${prNumber}`;
      fsa.write(output, prUrl);
    }
  }
}

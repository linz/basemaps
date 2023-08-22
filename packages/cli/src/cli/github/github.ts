import { Env, LogType } from '@basemaps/shared';
import { execFileSync } from 'child_process';
import { Octokit } from '@octokit/core';
import { Api } from '@octokit/plugin-rest-endpoint-methods/dist-types/types.js';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';

export class Github {
  repo: string;
  org: string;
  logger: LogType;
  repoName: string;
  octokit: Api;

  constructor(repo: string, logger: LogType) {
    this.repo = repo;
    this.logger = logger;
    const [org, repoName] = repo.split('/');
    if (org == null || repoName == null) throw new Error(`Badly formatted repo name: ${repo}`);
    this.org = org;
    this.repoName = repoName;

    const token = Env.get(Env.GitHubToken);
    if (token == null) throw new Error('Please set up github token environment variable.');
    this.octokit = restEndpointMethods(new Octokit({ auth: token }));
  }

  isOk = (s: number): boolean => s >= 200 && s <= 299;

  /**
   * Clone the repository
   *
   */
  clone(): void {
    const ssh = `git@github.com:${this.repo}.git`;
    this.logger.info({ repository: this.repo }, 'GitHub: Clone');
    execFileSync('git', ['clone', ssh]).toString().trim();
  }

  /**
   * Get branch by name if exists, or create a new branch by name.
   *
   * @returns {branch} github references or the new created branch
   */
  getBranch(branch: string): string {
    this.logger.info({ branch }, 'GitHub: Get branch');
    try {
      execFileSync('git', ['checkout', branch], { cwd: this.repoName }).toString().trim();
      this.logger.info({ branch }, 'GitHub: Branch Checkout');
      return branch;
    } catch {
      this.logger.info({ branch }, 'GitHub: Create New Branch');
      execFileSync('git', ['checkout', '-b', branch], { cwd: this.repoName }).toString().trim();
      return branch;
    }
  }

  /**
   * Config github user email and user name
   *
   */
  configUser(): void {
    const email = Env.get('GIT_USER_EMAIL') ?? 'basemaps@linz.govt.nz';
    const name = Env.get('GIT_USER_NAME') ?? 'basemaps[bot]';
    this.logger.info({ repository: this.repo }, 'GitHub: Config User Email');
    execFileSync('git', ['config', 'user.email', email], { cwd: this.repoName }).toString().trim();
    this.logger.info({ repository: this.repo }, 'GitHub: Config User Name');
    execFileSync('git', ['config', 'user.name', name], { cwd: this.repoName }).toString().trim();
  }

  /**
   * Commit the changes to current branch
   *
   */
  add(paths: string[]): void {
    this.logger.info({ repository: this.repo }, 'GitHub: Add Path');
    for (const path of paths) {
      execFileSync('git', ['add', path], { cwd: this.repoName }).toString().trim();
    }
  }

  /**
   * Commit the changes to current branch
   *
   */
  commit(message: string): void {
    this.logger.info({ repository: this.repo }, 'GitHub: Commit');
    execFileSync('git', ['commit', '-m', message], { cwd: this.repoName }).toString().trim();
  }

  /**
   * Push the local brach
   *
   */
  push(): void {
    this.logger.info({ repository: this.repo }, 'GitHub: Push');
    execFileSync('git', ['push', 'origin', 'HEAD'], { cwd: this.repoName }).toString().trim();
  }

  /**
   * Create pull request
   * This needs to use github API to create Pull request by access token.
   *
   */
  async createPullRequests(branch: string, title: string, draft: boolean): Promise<number> {
    // Create pull request from the give head
    const response = await this.octokit.rest.pulls.create({
      owner: this.org,
      repo: this.repoName,
      title,
      head: branch,
      base: 'master',
      draft,
    });
    if (!this.isOk(response.status)) throw new Error('Failed to create pull request.');
    this.logger.info({ branch, url: response.data.html_url }, 'GitHub: Create Pull Request');
    return response.data.number;
  }
}

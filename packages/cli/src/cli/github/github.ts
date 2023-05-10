import { Env, LogType } from '@basemaps/shared';
import { execFileSync } from 'child_process';

export class Github {
  repo: string;
  logger: LogType;
  repoName: string;

  constructor(repo: string, logger: LogType) {
    this.repo = repo;
    this.logger = logger;
    const [org, repoName] = repo.split('/');
    if (org == null || repoName == null) throw new Error(`Badly formatted repo name: ${repo}`);
    this.repoName = repoName;
  }

  /**
   * Clone the repository
   *
   */
  clone(): void {
    const https = `https://github.com/${this.repo}.git`;
    this.logger.info({ repository: this.repo }, 'GitHub: Clone');
    execFileSync('git', ['clone', https]).toString().trim();
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
  commit(message: string): void {
    this.logger.info({ repository: this.repo }, 'GitHub: Commit all');
    execFileSync('git', ['commit', '-am', `"${JSON.stringify(message)}"`], { cwd: this.repoName })
      .toString()
      .trim();
  }

  /**
   * Push the local brach
   *
   */
  push(): void {
    this.logger.info({ repository: this.repo }, 'GitHub: Push');
    execFileSync('git', ['push', 'origin', 'HEAD'], { cwd: this.repoName }).toString().trim();
  }
}

import { Env, LogType } from '@basemaps/shared';
import { execFileSync } from 'child_process';

export class Github {
  repo = 'basemaps-config';
  logger: LogType;

  constructor(logger: LogType) {
    this.logger = logger;
  }

  /**
   * Clone the repository
   *
   */
  clone(): void {
    const https = `https://github.com/linz/${this.repo}.git`;
    this.logger.info({ repository: this.repo }, 'GitHub: Clone');
    execFileSync('git', ['clone', https]).toString().trim();
  }

  /**
   * Get branch by name if exists, or create a new branch by name.
   *
   * @returns {branch} github references or the new created branch
   */
  getBranch(branch: string): string {
    // const basePath = path.dirname(repo);
    this.logger.info({ branch }, 'GitHub: Get branch');
    try {
      execFileSync('git', ['checkout', branch], { cwd: this.repo }).toString().trim();
      this.logger.info({ branch }, 'GitHub: Branch Checkout');
      return branch;
    } catch {
      this.logger.info({ branch }, 'GitHub: Create New Branch');
      execFileSync('git', ['checkout', '-b', branch], { cwd: this.repo }).toString().trim();
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
    execFileSync('git', ['config', 'user.email', email], { cwd: this.repo }).toString().trim();
    this.logger.info({ repository: this.repo }, 'GitHub: Config User Name');
    execFileSync('git', ['config', 'user.name', name], { cwd: this.repo }).toString().trim();
  }

  /**
   * Commit the changes to current branch
   *
   */
  commit(message: string): void {
    this.logger.info({ repository: this.repo }, 'GitHub: Commit all');
    execFileSync('git', ['commit', '-am', `"${message}"`], { cwd: this.repo })
      .toString()
      .trim();
  }

  /**
   * Push the local brach
   *
   */
  push(): void {
    this.logger.info({ repository: this.repo }, 'GitHub: Push');
    execFileSync('git', ['push', 'origin', 'HEAD'], { cwd: this.repo }).toString().trim();
  }
}

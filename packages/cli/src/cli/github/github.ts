import { Env, LogType } from '@basemaps/shared';
import { Octokit } from '@octokit/core';

export const owner = 'linz'; // The Owner of the Github repository
export const repo = 'basemaps-config'; // Github repository name
export const base = 'master'; // Base head name of repository

export interface Job {
  imagery: string;
  tileMatrix: string;
  content: string;
}

export interface Blob {
  path: string;
  mode: '100644';
  type: 'blob';
  sha: string;
}

export class Github {
  octokit: Octokit;
  logger: LogType;

  constructor(logger: LogType) {
    this.logger = logger;
    const token = Env.get(Env.GitHubToken);
    if (token == null) throw new Error('Please set up github token environment variable.');
    this.octokit = new Octokit({ auth: token });
  }

  isOk = (s: number): boolean => s >= 200 && s <= 299;

  /**
   * Get branch by name if exists
   *
   * @returns {ref} github references or the new created branch
   */
  async getBranch(branch: string): Promise<string | undefined> {
    this.logger.info({ branch }, 'GitHub: Get branch');
    const response = await this.octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
      owner,
      repo,
      branch,
    });
    if (this.isOk(response.status)) return response.data.name;
    return;
  }

  /**
   * Create a new branch from the latest master branch
   *
   * @returns {ref} github references or the new created branch
   */
  async createBranch(branch: string, ref: string): Promise<void> {
    // Get the latest sha from master branch
    const master = await this.octokit.request(`GET /repos/{owner}/{repo}/git/refs/heads/${base}`, { owner, repo });
    if (!this.isOk(master.status)) throw new Error('Failed to get master head.');
    const sha = master.data.object.sha;

    // Create new branch from the latest master
    this.logger.info({ branch }, 'GitHub: Create branch');
    const response = await this.octokit.request(`POST /repos/{owner}/{repo}/git/refs`, {
      owner,
      repo,
      ref,
      sha,
    });
    if (!this.isOk(response.status)) throw new Error(`Failed to create branch ${branch}.`);
  }

  async createBlobs(content: string, path: string): Promise<Blob> {
    // Create the blobs with the files content
    this.logger.info({ path }, 'GitHub: Create blob');
    const blobRes = await this.octokit.request(`POST /repos/{owner}/{repo}/git/blobs`, {
      owner,
      repo,
      content,
      encoding: 'utf-8',
    });
    if (!this.isOk(blobRes.status)) throw new Error(`Failed to create data blob.`);

    const blobSha = blobRes.data.sha;
    return { path, mode: '100644', type: 'blob', sha: blobSha };
  }

  /**
   * Create a file imagery config file into basemaps-config/config/imagery and commit
   */
  async commit(branch: string, ref: string, blobs: Blob[], message: string): Promise<void> {
    // Get the last commit SHA of a specific branch
    this.logger.info({ branch }, 'GitHub: Commit Changes');
    const branchRes = await this.octokit.request(`GET /repos/{owner}/{repo}/git/${ref}`, { owner, repo });
    if (!this.isOk(branchRes.status)) throw new Error(`Failed to get ${branch} head.`);

    const lastCommitSha = branchRes.data.object.sha;

    // Create a tree which defines the folder structure
    const treeRes = await this.octokit.request(`POST /repos/{owner}/{repo}/git/trees`, {
      owner,
      repo,
      base_tree: lastCommitSha,
      tree: blobs,
    });
    if (!this.isOk(treeRes.status)) throw new Error(`Failed to create tree.`);

    const treeSha = treeRes.data.sha;

    // Create the commit
    const commitRes = await this.octokit.request(`POST /repos/{owner}/{repo}/git/commits`, {
      owner,
      repo,
      message,
      parents: [lastCommitSha],
      tree: treeSha,
    });
    if (!this.isOk(commitRes.status)) throw new Error(`Failed to create commit.`);

    const commitSha = commitRes.data.sha;

    // Update the reference of your branch to point to the new commit SHA
    const response = await this.octokit.request(`POST /repos/{owner}/{repo}/git/${ref}`, {
      owner,
      repo,
      ref,
      sha: commitSha,
    });
    if (!this.isOk(response.status)) throw new Error(`Failed to update branch ${branch} sha.`);
  }

  /**
   * Create a new pull request from the given branch and return pull request number
   */
  async createPullRequest(branch: string, ref: string, title: string, body: string, draft: boolean): Promise<number> {
    // Create pull request from the give head
    const response = await this.octokit.request(`POST /repos/{owner}/{repo}/pulls`, {
      owner,
      repo,
      title,
      body,
      head: ref,
      base,
      draft,
    });
    if (!this.isOk(response.status)) throw new Error('Failed to create pull request.');
    this.logger.info({ branch, url: response.data.html_url }, 'GitHub: Create Pull Request');
    return response.data.number;
  }

  /**
   * Update a new pull request from pull request number
   */
  async updatePullRequest(branch: string, title: string, body: string, pull_number: number): Promise<void> {
    // Update pull request by given pull_number
    const response = await this.octokit.request(`PATCH /repos/{owner}/{repo}/pulls/{pull_number}`, {
      owner,
      repo,
      pull_number,
      title,
      body,
      base,
    });
    if (!this.isOk(response.status)) throw new Error('Failed to update pull request.');
    this.logger.info({ branch, pull_number }, 'GitHub: Update Pull Request');
  }
}

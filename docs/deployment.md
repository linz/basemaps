# Deployment

Deployments of Basemaps are managed with github actions.

To trigger a deployment, make sure your branch is up to date and run the version bump script [../scripts/version.bump.sh](../scripts/version.bump.sh)
This script will create a `release:` commit and branch, please review the commit then create a pull request from it.

Once the release pull request is merged the CI system will deploy the released version into dev then into production.

## Deployment Rollback

If a deployment breaks production, don't try to fix it on the fly, this risks introducing more errors and downtime. The fastest way to ensure production is stable again is to roll back to the previous release immediately and then focus on fixing the problem before the next release.

As Basemaps deployments are managed with GitHub Actions, every release will bundle the release packages and deployment in the GitHub Action run automatically. So, it is very simple for us to roll back to a previous release as all the previous deployments remain in history. Please use the following steps to trigger a roll back when needed.

- Open the Basemaps Deployments page - https://github.com/linz/basemaps/deployments
- Choose the environment that needs to be rolled back
- Open the workflow run for an older release

![Workflow runs for older releases](./static/workflow-run.png | width=400)

- Select the `Build / deploy-prod (push)` workflow and re-run it to roll back to a previous release.

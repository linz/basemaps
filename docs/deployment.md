# Deployment

Deployments of Basemaps are managed with github actions.

To trigger a deployment, make sure your branch is up to date and run the version bump script [./scripts/version.bump.sh](./scripts/version.bump.sh)
This script will create a `release:` commit and branch, please review the commit then create a pull request from it.

Once the release pull request is merged the CI system will deploy the released version into dev then into production.

## Deployment Rollback

If a Deployment Breaks Badly, don't try to fix that on the fly, this risk of introducing more errors and downtime. The fastest way is to rollback to previous release immediately and fix the problem before next release.

As Basemaps deployments are managed with github actions, every release will bundle the release packages and deployment in the github action automatically. So, it is very simple for use to roll back to previous release as all the previous deployment are remained in the github actions history. Please use the following steps to trigger a deployment roll when needed.

- Open the basemaps deployments page - https://github.com/linz/basemaps/deployments
- Choose the environment that needs to be rolled back
- Open the workflow run for a older release

![Workflow runs for older releases](./static/workflow-run.png | width=400)

- Select `Build / deploy-prod (push)` workflow and rerun the it to roll back to previous release.

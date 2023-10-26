# @basemaps/infra

Infrastructure code that using [AWS CDK](https://github.com/aws/aws-cdk) to deploy and manage the AWS infrastructure for Basemaps

## Stacks

There are three following stacks used for Basemaps system

### Table

`TileMetadataTable` table, this dynamodb table is shared across stacks so it is deployed as a separated stack.
It is used to save the Metadata of the Basemaps configurations in the [@basemaps/config](../config/).

### Serve

The core tile generation service for [@basemaps/lambda-tiler](../lambda-tiler/) APIs, this service generates the tiles and serves them via a application load balancer which is connected to Edge

### Edge

This is the edge of the tile serving, it is the egress point for all tiles. It deploys a CloudFront distribution with a lambda function that serve tiles for the Serve Stack

## Usage

The infrastructure needs a number of environment variables to run

```javascript
// The accountId that will be used to deploy into
CDK_DEFAULT_ACCOUNT;

// Due to the convoluted way that TLS certificates are made inside LINZ a hard coded TLS ARN is needed for the load balancer and Cloudfront
ALB_CERTIFICATE_ARN;
CLOUDFRONT_CERTIFICATE_ARN;
```

For first usage you will need to bootstrap the account, this will create a s3 bucket to store CDK assets in

```bash
npx cdk bootstrap
```

To create a CloudFormation template

```bash
npx cdk synth
```

To list all the available stacks

```bash
npx cdk list
```

To deploy `ServeStack` stack
```bash
npx cdk deploy ServeStack
```

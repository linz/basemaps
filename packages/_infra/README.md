# @basemaps/infra

Using AWS CDK to deploy and manage the infrastructure for basemaps

## Stacks

There are three stacks used for this system

### Table

API Key table, this dynamodb table is shared across stacks so it is deployed as a sperate stack.
It is used to track api key usage

### Edge

This is the edge of the tile serving, it is the egress point for all tiles. It deploys a CloudFront distribution with a lambda function that validates API Keys against the API Key Table

### Serve

The core tile generation service, this service generates the tiles and serves them via a application load balancer which is connected to Edge


## Usage

The infrastructure needs a number of environment variables to run

```javascript
// The accountId that will be used to deploy into
CDK_DEFAULT_ACCOUNT

// Due to the convoluted way that TLS certificates are made inside LINZ a hard coded TLS ARN is needed for the load balancer
ALB_CERTIFICATE_ARN
```


For first usage you will need to bootstrap the account, this will create a s3 bucket to store CDK assets in

```bash
npx cdk bootstrap
```

To create a CloudFormation template

```bash
cdk synth
```

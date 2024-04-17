export const BaseMapsRegion = 'ap-southeast-2';

export interface BaseMapsConfig {
  /** S3 bucket where all the cogs are stored */
  CogBucket: string[];

  /** Domain name for CloudFront to bind to */
  CloudFrontDns: string[];

  /** Public URL base that tiles are served from */
  PublicUrlBase: string;

  /** AWS role config bucket */
  AwsRoleConfigBucket: string;
}

export const BaseMapsProdConfig: BaseMapsConfig = {
  CogBucket: [
    'linz-basemaps',
    'linz-basemaps-vector',
    `linz-basemaps-staging`,
    `linz-basemaps-scratch`,
    'linz-workflow-artifacts',
    'linz-workflows-scratch',
  ],
  CloudFrontDns: ['basemaps.linz.govt.nz', 'tiles.basemaps.linz.govt.nz'],
  PublicUrlBase: 'https://basemaps.linz.govt.nz',
  AwsRoleConfigBucket: 'linz-bucket-config',
};

export const BaseMapsDevConfig: BaseMapsConfig = {
  CogBucket: ['basemaps-cog-test', ...BaseMapsProdConfig.CogBucket],
  CloudFrontDns: ['dev.basemaps.linz.govt.nz', 'tiles.dev.basemaps.linz.govt.nz'],
  PublicUrlBase: 'https://dev.basemaps.linz.govt.nz',
  AwsRoleConfigBucket: 'linz-bucket-config',
};
/** Is this deployment intended for production */
export const IsProduction = process.env['NODE_ENV'] === 'production';

export function getConfig(): BaseMapsConfig {
  if (IsProduction) return BaseMapsProdConfig;
  return BaseMapsDevConfig;
}

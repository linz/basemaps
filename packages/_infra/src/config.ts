export const BaseMapsRegion = 'ap-southeast-2';

export interface BaseMapsConfig {
  /** S3 bucket where all the cogs are stored */
  CogBucket: string[];

  /** Domain name for CloudFront to bind to */
  CloudFrontDns: string[];

  /** Internal route53 domain zone */
  Route53Zone: string;

  /** Domain name for CloudFront to use */
  AlbPublicDns: string;

  /** Public URL base that tiles are served from */
  PublicUrlBase: string;
}

export const BaseMapsProdConfig: BaseMapsConfig = {
  CogBucket: ['linz-basemaps', 'linz-basemaps-vector'],
  Route53Zone: 'prod.basemaps.awsint.linz.govt.nz.',
  AlbPublicDns: 'int.tiles.basemaps.linz.govt.nz',
  CloudFrontDns: ['basemaps.linz.govt.nz', 'tiles.basemaps.linz.govt.nz'],
  PublicUrlBase: 'https://basemaps.linz.govt.nz',
};

export const BaseMapsDevConfig: BaseMapsConfig = {
  CogBucket: ['basemaps-cog-test', ...BaseMapsProdConfig.CogBucket],
  Route53Zone: 'nonprod.basemaps.awsint.linz.govt.nz',
  AlbPublicDns: 'dev.int.tiles.basemaps.linz.govt.nz',
  CloudFrontDns: ['dev.basemaps.linz.govt.nz', 'tiles.dev.basemaps.linz.govt.nz'],
  PublicUrlBase: 'https://dev.basemaps.linz.govt.nz',
};

export function getConfig(): BaseMapsConfig {
  if (process.env.NODE_ENV === 'production') {
    return BaseMapsProdConfig;
  }
  return BaseMapsDevConfig;
}

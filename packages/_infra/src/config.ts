export interface BaseMapsConfig {
    /** S3 bucket where all the cogs are stored */
    CogBucket: string;

    /** Domain name for CloudFront to bind to */
    CloudFrontDns?: string[];

    /** Internal route53 domain zone */
    Route53Zone: string;

    /** Domain name for CloudFront to use */
    AlbPublicDns: string;
}

export const BaseMapsDevConfig: BaseMapsConfig = {
    CogBucket: 'basemaps-cog-test',
    Route53Zone: 'nonprod.basemaps.awsint.linz.govt.nz',
    AlbPublicDns: 'dev.int.tiles.basemaps.linz.govt.nz',
};

export const BaseMapsProdConfig: BaseMapsConfig = {
    CogBucket: 'linz-basemaps',
    Route53Zone: 'prod.basemaps.awsint.linz.govt.nz.',
    AlbPublicDns: 'int.tiles.basemaps.linz.govt.nz',
    CloudFrontDns: ['tiles.basemaps.linz.govt.nz', 'basemaps.linz.govt.nz'],
};

export function getConfig(): BaseMapsConfig {
    if (process.env.NODE_ENV == 'production') {
        return BaseMapsProdConfig;
    }
    return BaseMapsDevConfig;
}

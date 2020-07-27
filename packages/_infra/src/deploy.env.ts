export const DeployEnv = {
    /** Default AWS accountId to use */
    CdkAccount: 'CDK_DEFAULT_ACCOUNT',

    /** TLS certificate to use with the ALB */
    AlbTlsCertArn: 'ALB_CERTIFICATE_ARN',

    /** TLS certificate to use with Cloudfront */
    CloudFrontTlsCertArn: 'CLOUDFRONT_CERTIFICATE_ARN',

    /** Allow another account to write logs into our bucket */
    LogAccountId: 'LOG_ACCOUNT_ID',
};

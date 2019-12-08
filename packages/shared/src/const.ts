// TODO load these from env vars
export const Const = {
    Aws: {
        Region: 'ap-southeast-2',
    },
    ApiKey: {
        QueryString: 'api',
        TableName: 'ApiKey',
        RequestLimitMinute: 1000,
    },
};

export const Env = {
    Version: 'BASEMAPS_VERSION',
    Hash: 'BASEMAPS_HASH',
    CogBucket: 'COG_BUCKET',

    Gdal: {
        /** GDAL container information to use when building cogs */
        DockerContainer: 'GDAL_DOCKER_CONTAINER',
        DockerContainerTag: 'GDAL_DOCKER_CONTAINER_TAG',
    },
};

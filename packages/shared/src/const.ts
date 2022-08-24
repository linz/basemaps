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
  TileMetadata: {
    TableName: 'TileMetadata',
    RequestLimitMinute: 1000,
  },
};

export const Env = {
  /** Public URL base that tiles are served from */
  PublicUrlBase: 'BASEMAPS_PUBLIC_URL',

  /** Location of sprites and glyphs */
  AssetLocation: 'BASEMAPS_ASSEST_LOCATION',

  /** How many tiffs to load at one time */
  TiffConcurrency: 'TIFF_CONCURRENCY',

  /** Temporary folder used for processing, @default /tmp */
  TempFolder: 'TEMP_FOLDER',

  /** Batch Index offset used to control multiple batch jobs */
  BatchIndex: 'AWS_BATCH_JOB_ARRAY_INDEX',

  /** Number of hours to assume a role for, @default 8 */
  AwsRoleDurationHours: 'AWS_ROLE_DURATION_HOURS',

  /** AWS role config bucket */
  AwsRoleConfigPath: 'AWS_ROLE_CONFIG_PATH',

  /** Import Imagery bucket */
  ImportImageryBucket: 'IMPORT_IMAGERY_BUCKET',

  /** Import Imagery files number limit */
  ImportFilesNumberLimit: 'FILES_NUMBER_LIMIT',

  /** Import Imagery files total size limit in GB */
  ImportFilesSizeLimitGb: 'FILES_SIZE_LIMIT_GB',

  Gdal: {
    /** Should the gdal docker container be used? */
    UseDocker: 'GDAL_DOCKER',
    /** GDAL container information to use when building cogs */
    DockerContainer: 'GDAL_DOCKER_CONTAINER',
    DockerContainerTag: 'GDAL_DOCKER_CONTAINER_TAG',
  },

  Analytics: {
    CloudFrontId: 'ANALYTICS_CLOUD_FRONT_ID',
    CloudFrontSourceBucket: 'ANALYTICS_CLOUD_FRONT_SOURCE_BUCKET',
    CacheBucket: 'ANALYTICS_CACHE_BUCKET',
  },

  /** Load a environment var defaulting to defaultOutput if it does not exist  */
  get(envName: string): string | undefined {
    return process.env[envName];
  },

  /** Load an environment variable as a float, defaulting to defaultNumber if it does not exist */
  getNumber(envName: string, defaultNumber: number): number {
    const current = Env.get(envName);
    if (current === '' || current == null) {
      return defaultNumber;
    }

    const output = parseFloat(current);
    if (isNaN(output)) {
      return defaultNumber;
    }
    return output;
  },

  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  },
};

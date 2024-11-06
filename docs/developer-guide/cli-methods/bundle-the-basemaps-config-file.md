# Bundle the `basemaps` config file

This guide explains how to generate the `basemaps` bundled config file using the **basemaps/cli** package.

## Prerequisites

### Imagery

=== "Using LINZ's imagery"

You'll need **AWS credentials** with permission to read files from the **LINZ AWS S3** bucket at `s3://linz-basemaps`. Such credentials are required to access LINZ's imagery when bundling the config file.

## Get started

Clone the [**linz/basemaps-config**][bm_config_repo] repository to your machine.

=== "HTTPS"

    ```bash
    git clone https://github.com/linz/basemaps-config.git
    ```

=== "SSH"

    ```bash
    git clone git@github.com:linz/basemaps-config.git
    ```

=== "GitHub CLI"

    ```bash
    gh repo clone linz/basemaps-config
    ```

!!! abstract "Paths"

    This guide uses variables as shorthand to reference key directories and files. On your machine, note the following paths:

    === "`BM_CONFIG_REPO`"

        The path to the **basemaps-config** repository folder on your machine.

        ```bash
        $BM_CONFIG_REPO = {path_to}/basemaps-config
        ```

    === "`BM_CLI_BUILD`"

        The **basemaps/cli** package provides a **bundle** function we can use to generate a bundled config file.

        The path to the **build** folder of the **basemaps/cli** package.

        ```bash
        $BM_CLI_BUILD = $BM_REPO/packages/cli/build/cli
        ```

## Run the `basemaps/cli` package

### Command

Use the following command to bundle the `basemaps` config file:

```bash
node $BM_CLI_BUILD/bin.js bundle \
    --config $BM_CONFIG_REPO/config \
    --output config.bundle.json \
    --cache s3://linz-basemaps-staging/basemaps-config/cache/
```

### Parameters

=== "`--config`"

    Specifies the location of the config folder to use. This folder refers to that of which is within the `basemaps-config` repository.

=== "`--output`"

    Specifies where to save the bundled config file, relative to the location from which you execute the command. You can specify a location and filename of your choice.

=== "`--cache`"

    Specifies the location of the cache directory. This parameter is optional but recommended to reduce the time needed to construct the config file.

<!-- external links -->

[bm_config_repo]: https://github.com/linz/basemaps-config

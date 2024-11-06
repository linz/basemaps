# Bundle the `basemaps` assets archive

This guide explains how to generate the `basemaps` bundled assets archive using the **basemaps/cli** package.

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

        The **basemaps/cli** package provides a **bundle-assets** function we can use to generate a bundled assets archive.

        The path to the **build** folder of the **basemaps/cli** package.

        ```bash
        $BM_CLI_BUILD = $BM_REPO/packages/cli/build/cli
        ```

    === "`BM_SPRITES_BIN`"

        The **basemaps/sprites** package provides a default function we can use to generate sprite sheets from a collection of sprite images.

        The path to the **bin** folder of the **basemaps/sprites** package.

        ```bash
        $BM_SPRITES_BIN = $BM_REPO/packages/sprites/bin
        ```
## Run the `basemaps/cli` package

### Command

Use the following command to bundle the `basemaps` assets archive:

```bash
node $BM_CLI_BUILD/bin.js bundle-assets \
    --assets $BM_CONFIG_REPO/assets \
    --output assets.bundle.tar.co \
```

### Parameters

=== "`--assets`"

    Specifies the location of the assets folder to use. This folder refers to that of which is within the `basemaps-config` repository.

=== "`--output`"

    Specifies where to save the bundled assets archive, relative to the location from which you execute the command. You can specify a location and filename of your choice.

<!-- external links -->

[bm_config_repo]: https://github.com/linz/basemaps-config

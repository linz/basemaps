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

## Generate the `basemaps` assets

### 1. Create local directory

To prepare for bundling the `basemaps` assets archive, create a local directory on your machine with the following subdirectory structure:

```md
- assets
  - fonts
  - sprites
```

You can specify a location and directory name of your choice.

!!! abstract "Path"

    On your machine, consider the following path:

    === "`ASSETS_DIR`"

        The path to the created directory on your machine.

        ```bash
        $ASSETS_DIR = {path_to_directory}
        ```

### 2. Convert fonts into `.pbf` (protobuf-encoded glyphs) files

To generate the `basemaps` `.pbf` files, follow the instructions described in this [README.md][fonts_readme] file. Alternatively, there is a [repository][pbf_fonts_repo] containing various fonts that have already been converted into the `.pbf` format.

Move the generated and/or downloaded collections of `.pbf` files **into** the following directory:

```
$ASSETS_DIR/assets/fonts
```

The contents of your `$ASSETS_DIR/assets/fonts` directory should look similar to the following:

```md
- $ASSETS_DIR/assets/fonts
  - Noto Sans Bold
    - 0-255.pbf
    - ...
  - Open Sans Bold
    - 0-255.pbf
    - ...
```

### 3. Convert sprite files into sprite sheets

Use the following command to generate the `basemaps` sprite sheets from the collection of topographic sprite files:

```bash
node $BM_SPRITES_BIN/basemaps-sprites.mjs \
$BM_CONFIG_REPO/config/sprites/topographic
```

The above command will output the resulting sprite sheets to the location from which you executed the command. Move the outputted files **into** the following directory:

```md
$ASSETS_DIR/assets/sprites
```

The contents of your `$ASSETS_DIR/assets/sprites` directory should look similar to the following:

```md
- $ASSETS_DIR/assets/sprites
  - topographic.json
  - topographic.png
  - topographic@2x.json
  - topographic@2x.png
```

## Run the `basemaps/cli` package

### Command

Use the following command to bundle the `basemaps` assets archive:

```bash
node $BM_CLI_BUILD/bin.js bundle-assets \
    --assets $ASSETS_DIR \
    --output assets.bundle.tar.co \
```

### Parameters

=== "`--assets`"

    Specifies the location of the assets folder to use. This folder refers to that which contains the `.pbf` files and sprite sheets on your local machine.

=== "`--output`"

    Specifies where to save the bundled assets archive, relative to the location from which you execute the command. You can specify a location and filename of your choice.

<!-- external links -->

[bm_config_repo]: https://github.com/linz/basemaps-config
[fonts_readme]: https://github.com/linz/basemaps-config/tree/master/config/fonts
[pbf_fonts_repo]: https://github.com/korywka/fonts.pbf

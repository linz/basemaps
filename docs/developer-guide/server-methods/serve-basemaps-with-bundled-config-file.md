# Serve `basemaps` using a bundled config file

This guide shows you how to configure and run the **basemaps/server** package using a bundled config file. The config file specifies metadata regarding which imagery collections the package can serve from the **LINZ AWS S3** bucket.

## Configure the `basemaps/server` package

=== "Config file"

    The **basemaps/server** package requires a config file to serve the **basemaps** system.

    === "Using the pre-generated config file"

        !!! abstract "Path"

            To use the exisiting config file stored in the **LINZ AWS S3** bucket, note the following path:

            === "`CONFIG_FILE`"

                The absolute path to the latest config file stored in the **LINZ AWS S3** bucket.

                ```bash
                $CONFIG_FILE = s3://linz-basemaps/config/config-latest.json.gz
                ```

    === "Generating the config file yourself"

        To generate the config file yourself, follow the [**Bundle the `basemaps` config file**][bundle-the-basemaps-config-file] guide. Then, return to this section.

        !!! abstract "Path"

            Once you have generated the config file, make a note of the file's location:

            === "`CONFIG_FILE`"

                The path to the generated config file on your machine.

                ```bash
                $CONFIG_FILE = {path_to}/config.bundle.json
                ```

=== "Assets archive"

    The **basemaps/server** package also allows you to specify the location of assets (e.g. fonts and sprites) to use when serving the **basemaps** system.

    !!! tip "Note"

        Specifying this location is not required to serve raster imagery. If you wish to serve vector imagery or view the labels overlay, you will need to specify this location. Otherwise, assets referenced by such layers will not load.

    === "Using the pre-generated assets archive"

        !!! abstract "Path"

            To use the exisiting assets archive stored in the **LINZ AWS S3** bucket, note the following path:

            === "`ASSETS_ARCHIVE`"

                The absolute path to the latest assets archive stored in the **LINZ AWS S3** bucket.

                ```bash
                $ASSETS_ARCHIVE = s3://linz-basemaps/assets/assets-latest.tar.co
                ```

    === "Generating the assets archive yourself"

        To generate the assets archive yourself, follow the [**Bundle the `basemaps` assets archive**][bundle-the-basemaps-assets-archive] guide. Then, return to this section.

        !!! abstract "Path"

            Once you have generated the assets archive, make a note of the archive's location:

            === "`ASSETS_ARCHIVE`"

                The path to the generated assets archive on your machine.

                ```bash
                $ASSETS_ARCHIVE = {path_to}/assets.bundle.tar.co
                ```

## Run the `basemaps/server` package

At this stage, you should have a path to a config file. You may also have a path to an assets archive. Either of which you are sourcing from the **LINZ AWS S3** bucket, or, have generated using the **basemaps/cli** package.

!!! abstract "Path"

    The **basemaps/server** package provides a default function to serve the **basemaps** system. Take note of the following path:

    === "`BM_SERVER_BUILD`"

        The path to the **build** folder of the **basemaps/server** package.

        ```bash
        $BM_SERVER_BUILD = $BM_REPO/packages/server/build
        ```

### Command

Use one of the following commands to run the **basemaps** system:

=== "Without assets"

    ```bash
    node $BM_SERVER_BUILD/bin.js --config $CONFIG_FILE
    ```

=== "With assets"

    ```bash
    node $BM_SERVER_BUILD/bin.js --config $CONFIG_FILE --assets $ASSETS_ARCHIVE
    ```

### Parameters

=== "`--config`"

    Specifies the location of the bundled config file to use.

=== "`--assets`"

    Specifies the location of the bundled assets archive to use.

<!-- internal links -->

[bundle-the-basemaps-config-file]: ../cli-methods/bundle-the-basemaps-config-file.md
[bundle-the-basemaps-assets-archive]: ../cli-methods/bundle-the-basemaps-assets-archive.md

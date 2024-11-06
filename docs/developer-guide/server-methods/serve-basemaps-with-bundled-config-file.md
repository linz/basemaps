# Serve `basemaps` using a bundled config file

This guide shows you how to configure and run the **basemaps/server** package using a bundled config file. The config file specifies metadata regarding which imagery collections the package can serve from the **LINZ AWS S3** bucket.

## Configure the `basemaps/server` package

The **basemaps/server** package requires a config file to serve the **basemaps** system.

You have two options. The first is to use the pre-generated config file stored in the **LINZ AWS S3** bucket. The second is to generate the config file yourself using the **basemaps/cli** package.

=== "Using the pre-generated config file"

    !!! abstract "Path"

        To use the exisiting config file stored in the **LINZ AWS S3** bucket, note of the following path:

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

## Run the `basemaps/server` package

At this stage, you should have a path to a config file. Either, to that which you are sourcing from the **LINZ AWS S3** bucket, or, have generated using the **basemaps/cli** package.

!!! abstract "Path"

    The **basemaps/server** package provides a default function to serve the **basemaps** system. Take note of the following path:

    === "`BM_SERVER_BIN`"

        The path to the **bin** folder of the **basemaps/server** package.
            
        ```bash
        $BM_SERVER_BIN = $BM_REPO/packages/server/bin
        ```

### Command

Use the following command to run the **basemaps** system:

```bash
node $BM_SERVER_BIN/basemaps-server.cjs --config $CONFIG_FILE
```

### Parameters

=== "`--config`"

    Specifies the location of the bundled config file to use.

<!-- internal links -->

[bundle-the-basemaps-config-file]: ../cli-methods/bundle-the-basemaps-config-file.md
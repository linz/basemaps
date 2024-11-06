# Serve `basemaps` using a collection of GeoTIFF files

This guide shows you how to configure and run the **basemaps/server** package using a collection of GeoTIFF files.

## Configure the `basemaps/server` package

The **basemaps/server** package requires a collection of GeoTIFF files from which it can serve the **basemaps** system.

!!! abstract "Path"

    Make a note of the following path:

    === "`IMAGERY_DIR`"

        The path to the root folder of your GeoTIFF file collection.
            
        ```bash
        $IMAGERY_DIR = {path_to_imagery_directory}
        ```

## Run the `basemaps/server` package

!!! abstract "Path"

    The **basemaps/server** package provides a default function to serve the **basemaps** system. Note the following path:

    === "`BM_SERVER_BIN`"

        The path to the **bin** folder of the **basemaps/server** package.
            
        ```bash
        $BM_SERVER_BIN = $BM_REPO/packages/server/bin
        ```

### Command

Use the following command to run the **Basemaps** system:

```bash
node $BM_SERVER_BIN/basemaps-server.cjs $IMAGERY_DIR
```

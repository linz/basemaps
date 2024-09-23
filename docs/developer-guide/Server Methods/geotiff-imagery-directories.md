# GeoTIFF Imagery Directories

[Running Basemaps Locally][running-basemaps-locally] \> [Configuring the Basemaps/server package][configuring-the-basemapsserver-package] \> Providing a list of paths to directories of GeoTIFF imagery files

## 1. Configuring the `Basemaps/server` package

This guide shows you how to configure and run the **basemaps/server** package by providing a path to a directory of GeoTIFF imagery files from which the package will serve.

#### Path: Imagery Directory

Let the following variable represent the path to the root folder of your imagery collection.

```bash
$IMAGERY_DIR = {path_to_imagery}
```

## 2. Running the `Basemaps/server` package

### Path: basemaps/server

The **basemaps/server** package provides a default function to run the **Basemaps** system. The path to the **bin** folder of the **basemaps/server** package is as follows:

```bash
$BM_SERVER_BIN = $BM_REPO/packages/server/bin
```

### Command

Use the following command to run the **Basemaps** system:

```bash
node $BM_SERVER_BIN/basemaps-server.cjs $IMAGERY_DIR
```

<!-- internal links -->

[running-basemaps-locally]: ../running-basemaps-locally.md
[configuring-the-basemapsserver-package]: ../running-basemaps-locally.md#2-configuring-the-basemapsserver-package
# Bundled Configuration File

[Running Basemaps Locally][running-basemaps-locally] \> [Configuring the Basemaps/server package][configuring-the-basemapsserver-package] \> Providing a path to a bundled configuration file

## 1. Configuring the `Basemaps/server` package

This guide shows you how to configure and run the **basemaps/server** package by providing a path to a bundled configuration file telling the package which imagery to serve and where to find it within the **LINZ AWS S3** bucket. You have two options:

### Option 1: Use the Pre-generated Bundled Configuration File

- You can use the existing bundled configuration file stored in the **LINZ AWS S3** bucket.

    #### Path: Configuration File

    If you choose this option, the absolute file path is as follows:

    ```bash
    $CONFIG_FILE = s3://linz-basemaps/config/config-latest.json.gz
    ```

    Skip to Section 2, [**Running the Basemaps/server Package**](#2-running-the-basemapsserver-package).

### Option 2: Generate the Configuration File

- You can generate the bundled configuration file using the **basemaps/cli** package.

    To generate the file yourself, follow the [**Generating the Bundled Configuration File**][generate-config-file] guide. Then, proceed to Section 2, [**Running the Basemaps/server Package**](#2-running-the-basemapsserver-package).

## 2. Running the `Basemaps/server` Package

At this stage, you should have a path to a bundled configuration file, either generated using the **basemaps/cli** package or from the **LINZ AWS S3** bucket.

### Path: basemaps/server

The **basemaps/server** package provides a default function to run the **Basemaps** system. The path to the **bin** folder of the **basemaps/server** package is as follows:

```bash
$BM_SERVER_BIN = $BM_REPO/packages/server/bin
```

### Command

Use the following command to run the **Basemaps** system:

```bash
node $BM_SERVER_BIN/basemaps-server.cjs --config $CONFIG_FILE
```

### Parameters

#### `--config`

Specifies the location of the bundled configuration file to use. This file refers to that of which you generated using the **basemaps/cli** package or are sourcing from the **LINZ AWS S3** bucket.

<!-- internal links -->

[running-basemaps-locally]: ../running-basemaps-locally.md
[configuring-the-basemapsserver-package]: ../running-basemaps-locally.md#2-configuring-the-basemapsserver-package
[generate-config-file]: ../CLI%20Methods/generating-the-bundled-config-file.md
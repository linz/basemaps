# How to run `basemaps` locally

This guide shows you how to set up and run a local instance of the **basemaps** system on your machine. This guide explains how to:

- build the **basemaps** packages
- configure and run the **basemaps/server** package:
  - using LINZ's imagery
  - using your own imagery

!!! note

    If you're planning to contribute to the **basemaps** repository, make sure you review the [**CONTRIBUTING**][contributing] document beforehand.

## Prerequisites

### NodeJS

You'll need **[Node.js](https://nodejs.org)** version `18` or higher to build the **basemaps** packages.

!!! tip

    You can use tools like [**fnm**](https://github.com/Schniz/fnm) or [**n**](https://github.com/tj/n) to manage **Node.js** versions on your machine.

### Imagery

=== "Using LINZ's imagery"

    You'll need **AWS credentials** with permission to read files from the **LINZ AWS S3** bucket at `s3://linz-basemaps`. Such credentials are needed to access or generate the config file required to run the **basemaps** system using LINZ's imagery.

=== "Using your own imagery"

    You'll need a **collection of GeoTIFF files** organised in any way you prefer. The collection must maintain a consistent resolution and spatial reference throughout. The **basemaps** system is only compatible with datasets with a uniform ground sampling distance and map projection.

## Get started

Clone the [**linz/basemaps**][bm_repo] repository to your machine.

=== "HTTPS"

    ```bash
    git clone https://github.com/linz/basemaps.git
    ```

=== "SSH"

    ```bash
    git clone git@github.com:linz/basemaps.git
    ```

=== "GitHub CLI"

    ```bash
    gh repo clone linz/basemaps
    ```

!!! abstract "Path"

    This guide uses variables as shorthand to reference key directories and files. On your machine, consider the following path:

    === "`BM_REPO`"

        The path to the **basemaps** repository folder on your machine.

        ```bash
        $BM_REPO = {path_to}/basemaps
        ```

## Build the `basemaps` packages

In a terminal, navigate to `BM_REPO` and run the following commands:

```bash
# Install the Node.js dependencies for the system
npm install

# Generate the <package_name>/build for each package
npm run build

# Run the unit tests for each package
npm run test
```

!!! tip

    You can build the `basemaps` packages in [watch mode][tsc_watch] so that they recompile anytime you modify the source code. In a terminal, navigate to `BM_REPO` and run the following command:

    ```bash
    # Generate the <package_name>/build for each package (watch mode)
    npm run build -- --watch
    ```

## Configure the `basemaps/server` package

There are two main ways you can configure and run the **basemaps/server** package:

=== "Using a bundled config file"

    [Serve `basemaps` using a bundled config file][bundled-config-file]

=== "Using a collection of GeoTIFF files"

    [Serve `basemaps` using a collection of GeoTIFF files][collection-of-geotiff-files]

<!-- internal links -->

[bundled-config-file]: ./server-methods/serve-basemaps-with-bundled-config-file.md
[collection-of-geotiff-files]: ./server-methods/serve-basemaps-with-collection-of-geotiff-files.md

<!-- external links -->

[bm_repo]: https://github.com/linz/basemaps
[configuration]: https://github.com/linz/basemaps/blob/master/docs/configuration.md
[contributing]: https://github.com/linz/basemaps/blob/master/CONTRIBUTING.md
[stac]: https://github.com/radiantearth/stac-spec/blob/master/overview.md
[tsc_watch]: https://www.typescriptlang.org/docs/handbook/project-references.html#tsc--b-commandline

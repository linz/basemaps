# Running Basemaps Locally

This guide walks you through setting up and running a local instance of the **Basemaps** system on your machine. This guide shows you how to:

- Build the packages in the **basemaps** repository
- Run the **basemaps/server** package on your machine using either:
    - [LINZ's imagery](#using-linzs-imagery)
    - [your own imagery](#using-your-own-imagery)


If you're planning to contribute to the **Basemaps** repository, make sure to review the [**CONTRIBUTING**][contributing] document.

## Prerequisites

### NodeJS

You need **[Node.js](https://nodejs.org)** version `18` or higher to build the **Basemaps** packages. You can use tools like [**fnm**](https://github.com/Schniz/fnm) or [**n**](https://github.com/tj/n) to manage **Node.js** versions on your machine.

### Imagery

- #### Using LINZ's Imagery

    If you wish to use LINZ's imagery, you'll need **AWS credentials** with permission to read files from the **LINZ AWS S3** bucket at `s3://linz-basemaps`. These credentials will allow you to access and/or generate the bundled configuration file required for running the **Basemaps/server** package.

- #### Using your own Imagery

    If you wish to use your own imagery, feel free to organise your collection(s) of GeoTIFF files however you like. However, be mindful when attempting to server datasets with differing ground sampling distances (GSDs).

## Cloning the Repository

### basemaps

You must clone the **basemaps** repository to your machine.

```bash
# Clone using the web URL
git clone https://github.com/linz/basemaps.git

# Clone using a password-protected SSH key
git clone git@github.com:linz/basemaps.git

# Clone using GitHub's official CLI
gh repo clone linz/basemaps
```

## Paths

This guide uses variables as shorthand to reference specific directories. On your machine, the consider the following path:

#### `BM_REPO`

The path to the root folder of the **basemaps** repository on your machine.

```bash
$BM_REPO = {path_to}/basemaps
```

## 1. Building the `Basemaps` Packages

In a terminal, navigate to your `BM_REPO` folder and run the following commands:

```bash
# Install the Node.js dependencies for the system
npm install

# Generate the <package_name>/build for each package
npm run build

# Run the unit tests for each package
npm run test
```

## 2. Configuring the `Basemaps/server` Package

There are two primary ways in which you can configure the **basemaps/server** package. Both of the guides below will show you how to configure and run the **basemaps/server** package, respectively.

- [**Providing a path to a bundled configuration JSON file**][bundled-json-config-file]
- [**Providing a list of paths to directories of GeoTIFF imagery files**][geotiff-imagery-directories]

<!-- internal links -->

[bundled-json-config-file]: ./Server%20Methods/bundled-json-config-file.md
[geotiff-imagery-directories]: ./Server%20Methods/geotiff-imagery-directories.md

<!-- external links -->

[configuration]: https://github.com/linz/basemaps/blob/master/docs/configuration.md
[contributing]: https://github.com/linz/basemaps/blob/master/CONTRIBUTING.md
[stac]: https://github.com/radiantearth/stac-spec/blob/master/overview.md
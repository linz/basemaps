# Running Basemaps Locally

This guide walks you through setting up and running a local instance of the **Basemaps** system on your machine. If you're planning to contribute to the **Basemaps** repository, make sure to review the [**CONTRIBUTING**](../../CONTRIBUTING.md) document.

## Prerequisites

### NodeJS

You need **[Node.js](https://nodejs.org)** version `18` or higher to build the **Basemaps** packages. You can use tools like [**fnm**](https://github.com/Schniz/fnm) or [**n**](https://github.com/tj/n) to manage **Node.js** versions on your machine.

### AWS S3 Access

You'll need **AWS credentials** with permission to read files from the **LINZ AWS S3** bucket at `s3://linz-basemaps`. These credentials will allow you to access and/or generate the *JSON configuration file* required for running the **Basemaps/server** package.

## Cloning the Repositories

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

### basemaps-config

If you intend to generate the *JSON configuration file* required for running the **basemaps/server** package yourself, you must also clone the **basemaps-config** repository to your machine.

```bash
# Clone using the web URL
git clone https://github.com/linz/basemaps-config.git

# Clone using a password-protected SSH key
git clone git@github.com:linz/basemaps-config.git

# Clone using GitHub's official CLI
gh repo clone linz/basemaps-config
```

## Paths

This document uses variables as shorthand to reference specific directories. On your machine, the corresponding paths are as follows:

#### `BM_REPO`

The path to the root folder of the **basemaps** repository on your machine.

```bash
$BM_REPO = {path_to}/basemaps
```

#### `BM_CONFIG_REPO`

The path to the root folder of the **basemaps-config** repository on your machine. 

```bash
$BM_CONFIG_REPO = {path_to}/basemaps-config
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

Next, you need the *JSON configuration file* that tells the **basemaps/server** package which imagery to serve and where to find it in the **LINZ AWS S3** bucket. You have two options:

### Option 1: Use the Pre-generated Configuration File

You can use the existing configuration file stored in the **LINZ AWS S3** bucket.

#### Path: Configuration File

If you choose this option, the absolute file path is as follows:

```bash
$CONFIG_FILE = s3://linz-basemaps/config/config-latest.json.gz
```

Skip to Section 3, [**Running the Basemaps/server Package**](#running-the-basemapsserver-package).

### Option 2: Generate the Configuration File

To generate the configuration file yourself, skip to Appendix 1, [**Generation the Configuration File**](#1-generating-the-configuration-file). Then, proceed to Section 3, [**Running the Basemaps/server Package**](#3-running-the-basemapsserver-package).

## 3. Running the `Basemaps/server` Package

At this stage, you should have the configuration file, either generated using the **basemaps/cli** package or from the **LINZ AWS S3** bucket.

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

Specifies the location of the *JSON configuration file* to use. This file refers to that of which you generated using the **basemaps/cli** package or are sourcing from the **LINZ AWS S3** bucket.

# Appendix

## 1. Generating the Configuration File

### Path: basemaps/cli

The **basemaps/cli** package provides a **bundle** function to generate the configuration file. The path to the **bin** folder of the **basemaps/cli** package is as follows:


```bash
$BM_CLI_BIN = $BM_REPO/packages/cli/bin
```

### Command

Use the following command to generate the configuration file:

```bash
node $BM_CLI_BIN/bmc.js bundle \
    --config $BM_CONFIG_REPO/config \
    --output $BM_REPO/config/config.bundle.json \
    --cache s3://linz-basemaps-staging/basemaps-config/cache/
```

### Parameters

#### `--config`

Specifies the location of the config folder to use. This folder refers to that of which is within the `basemaps-config` repository.

#### `--output`

Specifies where to save the generated configuration file. You can specify a location of your choice. For convenience, simply specify the output location as the `basemaps` repository.

#### `--cache`

Optionally, specify the location of the cache directory. Doing so greatly reduces the time required to generate the configuration file. Without this parameter, generating the file can take 15-20 minutes. With it, generating the file should take less than 1 minute.

### Path: Configuration File

Once you have generated the configuration file, note the file's absolute path. If you specified the output location as the `basemaps` repository, then the absolute file path should be as follows:

```bash
$CONFIG_FILE = $BM_REPO/config/config.bundle.json
```

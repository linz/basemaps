# Generating the Bundled Configuration File

[Running Basemaps Locally][running-basemaps-locally] \> [Configuring the Basemaps/server package][configuring-the-basemapsserver-package] \> [Providing a path to a bundled configuration JSON file][path-to-json-config-file] \> Generating the Configuration File

This guide shows you how to generate the bundled configuration file using the **basemaps/cli** package.

## Prerequisites

### AWS Credentials

You'll need **AWS credentials** with permission to read files from the **LINZ AWS S3** bucket at `s3://linz-basemaps`. These credentials will allow you to access and/or generate the bundled configuration file required for running the **Basemaps/server** package.

## Cloning the Repository

### basemaps-config

You must clone the **basemaps-config** repository to your machine.

```bash
# Clone using the web URL
git clone https://github.com/linz/basemaps-config.git

# Clone using a password-protected SSH key
git clone git@github.com:linz/basemaps-config.git

# Clone using GitHub's official CLI
gh repo clone linz/basemaps-config
```

### Paths

On your machine, consider the following paths:

#### `BM_CONFIG_REPO`

The path to the root folder of the **basemaps-config** repository on your machine. 

```bash
$BM_CONFIG_REPO = {path_to}/basemaps-config
```

#### `BM_CLI_BIN`

The **basemaps/cli** package provides a **bundle** function to generate the bundled configuration file. The path to the **bin** folder of the **basemaps/cli** package is as follows:

```bash
$BM_CLI_BIN = $BM_REPO/packages/cli/bin
```

### Command

Use the following command to generate the bundled configuration file:

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

Specifies where to save the bundled configuration file. You can specify a location of your choice. For convenience, simply specify the output location as the `basemaps` repository.

#### `--cache`

Optionally, specify the location of the cache directory. Doing so greatly reduces the time required to generate the bundled configuration file. Without this parameter, generating the file can take 15-20 minutes. With it, generating the file should take less than 1 minute.

### Path: Bundled Configuration File

Once you have generated the file, note its absolute path. If you specified the output location as the `basemaps` repository, then the absolute file path should similar to the following:

```bash
$CONFIG_FILE = $BM_REPO/config/config.bundle.json
```

<!-- internal links -->

[running-basemaps-locally]: ../running-basemaps-locally.md
[configuring-the-basemapsserver-package]: ../running-basemaps-locally.md#2-configuring-the-basemapsserver-package
[path-to-json-config-file]: ../Server%20Methods/json-config-file.md
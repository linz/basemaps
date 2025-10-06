# How we Create our Vector Tiles

Our system generates vector tiles and stores them together as an `MBTiles` file.

!!! info "What is an `MBTiles` file?"

    An [`MBTiles`][1] file is a file format and specification for storing vector tiles in the form of a single SQLite database. You can think of it as a filing cabinent that stores vector tiles in an efficient, organised way.

## Our Vector Tile Pipeline

Our pipeline comprises three key steps, **Extract**, **Create**, and **Join**. In sequence, these three steps allow you to transform a set of vector datasets into a collective `MBTiles` file. We also have an additional step: **Analyse**. This step allows you to capture metrics about an `MBTiles` file's contents, useful for inspecting tile sizes and feature counts by layer.

## Key Steps

The following sections provide details about the **inputs** required, **process**, and **outputs** generated for each step:

=== "Extract"

    Validates [`JSON` schema files][2], generates `JSON` STAC items, and prepare processing tasks for the create command.

    **Input**

    [`JSON` schema files][2] defining source layers and data schemas

    **Process**

    - Validates schema definitions and checks for data updates
    - Determines which layers need processing by checking cache status
    - Creates STAC (SpatioTemporal Asset Catalog) metadata files for each layer
    - Separates layers into small and large processing queues for optimization

    **Output**

    `JSON` STAC items listing layers to process, cache status, and STAC metadata

=== "Create"

    Parses `JSON` STAC items, downloads the vector datasets, transforms each dataset's features, and combines them into individual `MBTiles` files.

    **Input**

      `JSON` STAC items describing individual datasets by layer

    **Process**

    - Downloads source geospatial files (GeoPackage, Shapefile, etc.)
    - Converts to NDJSON format using OGR2OGR
    - Applies feature generalization and simplification
    - Generates `MBTiles` using Tippecanoe
    - Updates STAC metadata with processing results

    **Output**

    Individual `MBTiles` files for each layer

=== "Join"

    Combines multiple `MBTiles` files into one, and generates a tar.co archive file.

    **Input**

    Multiple `MBTiles` files (from Create command)

    **Process**

    - Combines multiple `MBTiles` files into one
    - Generates a TAR.CO (Cloud Optimized TAR) archive
    - Creates tile index files for efficient access
    - Builds STAC catalogs for the combined dataset

    **Output**

    Combined `MBTiles` file, TAR.CO archive, index files, STAC catalogs

=== "Analyse"

    Generates a report detailing metrics about the generated `MBTiles` file.

    **Input**

    `MBTiles` files (local or remote)

    **Process**

    - Examines tiles across all zoom levels (0-15)
    - Analyzes tile size distributions and identifies largest tiles
    - Calculates layer statistics (feature counts, geometry sizes, attributes)
    - Generates comprehensive performance metrics
    - Creates formatted reports using Mustache templates

    **Output**

    Detailed Markdown analysis reports

<!-- external links -->

[1]: https://github.com/mapbox/mbtiles-spec
[2]: inputs/json-schema-file.md

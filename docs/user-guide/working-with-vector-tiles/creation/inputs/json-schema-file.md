# `JSON` Schema File

This document provides a template and example of a `JSON` Schema file as required by the **Extract** step of our **Vector Tile Pipeline**.

=== "Template"

    ```typescript
    {
      /** layer name */
      name: string,

      metadata: {
        /** source feature attributes to preserve across all layers */
        attributes: string[]
      },

      layers: {
        /** lds layer id */
        id: string,

        /** lds layer version */
        version?: number,

        /** lds layer name */
        name: string,

        /** source location of the layer's vector dataset */
        source: string,

        /** static key-value attributes to append to each feature */
        tags: {
          [key: string]: string | boolean
        },

        /** feature attributes to preserve or re-map from one key to another */
        attributes: {
          [key: string]: string
        },

        style: {
          /** the first z-layer for which to include this layer's features */
          minZoom: number,

          /** the last z-layer for which to include this layer's features */
          maxZoom: number,
        }
      }[]
    }
    ```

=== "Example"

    ```typescript
    {
      "name": "addresses",
      "metadata": {
        "attributes": [
          "housenumber",
          "name",
          "id"
        ]
      },
      "layers": [
        {
          "id": "105689",
          "name": "105689-nz-addresses-pilot",
          "source": "s3://linz-lds-cache/105689/",
          "tags": {},
          "attributes": {
            "address_id": "id",
            "full_address_number": "housenumber"
          },
          "style": {
            "minZoom": 15,
            "maxZoom": 15
          }
        }
      ]
    }
    ```

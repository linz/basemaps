# How to Use our Vector Tiles

## Accessing LINZ Vector Tiles

### API Endpoints

**LINZ vector tiles are available through:**

=== "Pattern"

      ```
      https://basemaps.linz.govt.nz/v1/styles/{tileset}.json?api={api_key}
      ```

=== "Example"

      ```
      https://basemaps.linz.govt.nz/v1/styles/topographic-v2.json?api=
      ```

**Individual tiles can be accessed through:**

=== "Pattern"

      ```
      https://basemaps.linz.govt.nz/v1/tiles/{tileset}/{crs}/{z}/{x}/{y}.pbf?api={api_key}
      ```

=== "Example (2193)"

      ```
      https://basemaps.linz.govt.nz/v1/tiles/topographic-v2/2193/10/512/512.pbf?api=
      ```

=== "Example (3857)"

      ```
      https://basemaps.linz.govt.nz/v1/tiles/topographic-v2/3857/10/1009/641.pbf?api=
      ```

**MBTiles can be downloaded through:**

=== "Pattern"

      ```
      https://basemaps.linz.govt.nz/v1/export/{tileset}/{crs}.mbtiles?api={api_key}
      ```

=== "Example (2193)"

      ```
      https://basemaps.linz.govt.nz/v1/export/topographic-v2/2193.mbtiles?api=
      ```

=== "Example (3857)"

      ```
      https://basemaps.linz.govt.nz/v1/export/topographic-v2/3857.mbtiles?api=
      ```

### Supported coordinate systems:

- 2193 (NZTM2000) - Best for New Zealand-specific applications
- 3857 (Web Mercator) - Recommended for web applications

## QGIS

QGIS 3.14+ has native support for vector tiles, making it straightforward to add and use them.

### Adding LINZ Vector Tiles to QGIS

1. **Via Data Source Manager**

   - Open Data Source Manager (Ctrl+L)
   - Select "Vector Tiles" tab
   - Click "New Generic Connection"
   - Fill in:
     - Name: "LINZ Topographic"
     - URL: `https://basemaps.linz.govt.nz/v1/styles/topographic-v2.json?api={api_key}`

2. **Via Browser Panel**

   - Right-click "Vector Tiles" in the Browser Panel
   - Select "New Generic Connection"
   - Enter the same details as above

3. **Add to Map**
   - Double-click the connection to add it to your map
   - The vector tiles will appear with default styling

## MapLibre GL JS

MapLibre is the recommended library for web applications using vector tiles.

### Basic Implementation

```html
--8<-- "user-guide/working-with-vector-tiles/usage/index.maplibre.vector.3857.html"
```

<iframe src="index.maplibre.vector.3857.html" height="500px" width="100%" scrolling="no"></iframe>

## ESRI Products

**Important Note**: ESRI products (ArcGIS Pro, ArcGIS Online) currently do not support the vector tile format used by LINZ Basemaps. For ESRI users, you'll need to use LINZ's raster tile services or XYZ/WMTS endpoints instead.

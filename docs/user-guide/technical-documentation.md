# Technical documentation and specifications

This page provides technical documentation and specifications to help you start building with LINZ Basemaps APIs.

## Technical specifications

### LINZ Aerial Basemap

At a platform level, the LINZ Basemaps APIs supports:

|                          |                                                               |
| ------------------------ | ------------------------------------------------------------- |
| **Protocols**            | WMTS and XYZ                                                  |
| **Output tiling scheme** | NZTM2000 and Web Mercator                                     |
| **Zoom levels**          | NZTM 0 - 17 and Web Mercator 0 - 22                           |
| **Output formats**       | WebP, Jpeg or PNG                                             |
| **Applications**         | GIS (e.g QGIS, ArcGIS), CAD and Javascript web or mobile apps |

### LINZ Topographic Basemap

At a platform level, the LINZ Basemaps APIs supports:

|                          |                                          |
| ------------------------ | ---------------------------------------- |
| **Protocols**            | Mapbox Vector Tiles (Protocol Buffers)   |
| **Output tiling scheme** | Web Mercator                             |
| **Zoom levels**          | Web Mercator 0 – 15                      |
| **Output formats**       | PBF                                      |
| **Applications**         | GIS (QGIS) Javascript web or mobile apps |

## API access levels

There is no charge for either access level.

|                      |                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Standard access**  | This is the default access level for customers. LINZ Basemap APIs at this level do not require registration. A dynamic API key is allocated to you. Standard access allows customers to execute up to 1,000 tile requests per minute and 1,000,000 requests per month. This access type is designed for use of our APIs in internal GIS applications or web mapping tools. Standard API keys need to be renewed after 90 days. |
| **Developer access** | This access level provides unlimited tile requests to developers to support integration of our APIs in public, high-volume web and mobile apps. Static API keys are issued to restrict use by others. Developers can request this access level by contacting us.                                                                                                                                                               |

## Protocols

### LINZ Aerial Basemaps

This API works with any client that supports either the XYZ or WMTS protocol - where XYZ is most commonly used in JavaScript clients, and WMTS (version 1.0.0) in GIS apps like QGIS or ArcGIS or modern CAD tools.

### LINZ Topographic Basemaps

This API works with any client that supports [TileJSON](https://github.com/mapbox/tilejson-spec) and [StyleJSON](https://docs.mapbox.com/mapbox-gl-js/style-spec/) such as GIS Applications (QGIS) or JavaScript clients.

## Tile matrix sets

LINZ Basemap APIs are provided in two output tiling schemes - WGS84 Web Mercator Quad (EPSG:3857) and NZTM2000 Quad (ESPG:2193). Each has its own tile matrix set that describes the zoom levels, scale and resolution for the images that are returned.

**LINZ Topographic Basemap is only supported in WGS84 Web Mercator Quad (EPSG:3857)**

### WGS84 Web Mercator Quad (EPSG:3857)

This tile set is most suitable for web mapping applications that have worldwide coverage or need to interact with third party tile services such as Google Maps or OSM map tiles without the need for re-projection or scaling.

[Web Mercator Quad tile matrix set definition](https://docs.ogc.org/is/17-083r2/17-083r2.html#62)

### NZTM2000 Quad (EPSG:2193)

This tile set presents New Zealand at its finest. It is most useful for New Zealand geospatial professionals and can be used for desktop GIS mapping. It is also recommended for New Zealand mainland web applications when area and distances need to be well represented on the map.

[NZTM2000 Quad tile matrix set definition](https://github.com/linz/NZTM2000TileMatrixSet/)

## Rate limits

Rate limits apply to Standard API access only, not Developer API access.

Rate liming applies to all API clients, at the API token and IP address level.

| Access level     | Request limit per minute | Request limit per month | API key nominated site restriction |
| ---------------- | ------------------------ | ----------------------- | ---------------------------------- |
| Standard access  | 1,000 requests / minute  | 1,000,000 / month       | No                                 |
| Developer access | Unlimited\* / minute     | Unlimited\* / month     | Yes                                |

## Rate limiting

### Per user - API key and IP

Rate limiting of a Standard access API is on a per user basis

Our rate limits are applied at a per-minute and per-month basis. Exceeding your access level's number requests per minute will result in an HTTP 429 Too Many Requests response.

### Abuse or persistent overuse of our APIs

Monitoring of our APIs will help us understand usage and track any persistent breaking of the limits. The Terms of Use for LINZ Basemaps allows us to revoke access where customers overuse or abuse our APIs.

### API key expiration

Standard API keys expire after 90 days. Our app will automatically generate a new key for you. Visit our app at https://basemaps.linz.govt.nz after 90 days to grab your new key.

Developer keys do not expire.

## Response codes

| Code | Text                      | Description                                                                                                       |
| ---- | ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 429  | Too many requests         | Your API key has had too many requests. Contact us to request a limit increase                                    |
| 404  | No tile information found | The server could not find what was requested                                                                      |
| 400  | Invalid API key           | Your API key has expired. Grab a new API key from https://basemaps.linz.govt.nz (applies to standard access only) |

## Authentication

Authentication is managed via API key for Developer level access. Developers do not need to authenticate separately to use our APIs, as the platform knows you’re a registered user from your API key.

## Aerial Imagery output format

You can request raster tiles in WebP, PNG or JPEG format.

Our recommended output format is WebP as it allows the quality of images to be maintained with relatively small file sizes and supports an alpha channel for transparency. This is also the default format in the XYZ URL you can copy from https://basemaps.linz.govt.nz

If WebP is not supported by your browser or application, we would suggest JPEG, then PNG.

## Data attribution

LINZ Basemaps use open data, licensed for reuse under the Creative Commons 4.0 International licence. Each LINZ Basemap product is made up of a variety of open data sources.

Your product must always visibly show attribution and link to the LINZ Basemap custom attribution data and copyright text. See our data attribution page for full details.

[Data attribution](https://www.linz.govt.nz/products-services/data/licensing-and-using-data/attributing-linz-basemaps-data)

## Security

Follow best and common-sense practices in the management of your API key. All use of your API key is your responsibility, whether authorised or not. If you suspect misuse by another user, we can disable an API key at any time.

Developer level access enables the allocation of static API keys which we can restrict to your nominated website.

## Build your own LINZ Basemap

If you provide business critical or high-volume services that require higher rate limits, LINZ Basemaps are available as an open source project for you to deploy into your own infrastructure. Visit our GitHub site or contact Basemaps support for more information.

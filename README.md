# Basemaps
This project is to deploy public basemaps of New Zealand, developed by LINZ using New Zealand data, on PublicCloud Amazon Web Services (AWS). Basemap services are  delivered to external and internal users that are used as a base layer for mapping applications online (e.g. Leaflet) and internally (e.g. QGIS).

## Definitions

- Basemap: A digital basemap put features into context. It provides consistent background detail necessary to orient location and add to aesthetic appeal. Basemaps can be made up of streets, parcels, boundaries (country, regional, and city boundaries), shaded relief of a digital elevation model, waterways, hydrography and aerial or satellite imagery. Basemaps can be used as desktop, website or mobile phone application components, or as a 3rd party layers within a GIS or desktop mapping application.

- Amazon Web Services(AWS): For this project Amazon Web Services are most often refered to as AWS

- Amazon Simple Storage Service (Amazon S3): For this project Amazon Web Services S3 are most often refered to as S3. For the purposes of this project, S3 is an object storage service storing our raster data and tile caches.

- Amazon CloudFront: Content Delivery Network (CDN) used for delivery of basemap tile cache

- Content Delivery Network (CDN): geographically distributed network of proxy servers and data centers

- Tile Cache: Collection of very small tiled images in the three dimensional file structure.

- Aerial Imagery: Imagery take from satellite or aircraft, specific for collecting geographic data.


## Features

- Aerial Imagery

## Components

- AWS S3 raster data storage
- AWS S3 raster data storage
- A PostgreSQL/PostGIS database schema for vector data storage (TODO: determine what our PostgreSQL structure will be.)
- AWS Cloudfront delivery

## License
This system is under the 3-clause BSD License, except where otherwise specified. See the [LICENSE](https://github.com/linz/basemaps/blob/master/LICENSE) file for more details.

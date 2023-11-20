# How to use LINZ Basemaps APIs

LINZ Basemaps APIs allow you to programmatically access LINZ map tile services to integrate into your mobile, web or GIS app. This documentation provides an overview of our map tile APIs and how to use them.

## WMTS map tile services

LINZ Basemaps supports WMTS version 1.0.0. While best suited for use in GIS apps, WMTS can also be deployed in Javascript clients.

Visit the Open [Geospatial Consortium](https://www.ogc.org/standard/wmts/) website for information about the standard.

If you're looking for step-by-step instructions for using WMTS in GIS apps, you can follow the same process we describe for using LINZ Data Service WMTS in QGIS and ArcGIS Desktop.

- QGIS
- ArcGIS Desktop

## WMTS URL syntax

https://basemaps.linz.govt.nz/v1/tiles/{tileset_name}/WMTSCapabilities.xml?api={api_key}

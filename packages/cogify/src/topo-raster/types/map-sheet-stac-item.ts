import { EpsgCode } from '@basemaps/geo';
import { StacAsset, StacItem } from 'stac-ts';

export interface MapSheetStacItem extends StacItem {
  assets: {
    /**
     * A StacAsset describing a map sheet's source file.
     *
     * @example {
     *   href: 's3://linz-topographic-upload/topographic/TopoReleaseArchive/NZTopo50_GeoTif_Gridless/CJ10_GRIDLESS_GeoTifv1-03.tif',
     *   type: 'image/tiff; application=geotiff',
     *   roles: ['data']
     *   'file:size': 144699034 (added during COG creation)
     *   'file:checksum': '12207e3a289637b0bbb921ad0c3a6404ce6b0149330cdc675d520ce9d690b7792d52' (added during COG creation)
     * }
     */
    source: StacAsset;

    /**
     * A StacAsset describing a map sheet's cloud-optimised file (added after COG creation).
     *
     * @example {
     *   href: './CJ10.tiff',
     *   type: 'image/tiff; application=geotiff; profile=cloud-optimized',
     *   roles: ['data'],
     *   'file:size': 2707038
     *   'file:checksum': '12204ea0ee43553e849b46a0f8b3281a532d855bac19e9d8845ea229056b568eccb5'
     * }
     */
    cog?: StacAsset;
  };
  properties: {
    /**
     * An ISO string representing a Stac Item's creation time.
     *
     * @pattern `YYYY-MM-DDTHH:mm:ss.sssZ`
     *
     * @example "2024-01-31T09:41:12.345Z"
     */
    datetime: string;

    /**
     * A map sheet's code.
     *
     * @example "CJ10"
     */
    map_code: string;

    /**
     * A map sheet's version.
     *
     * @example "v1.00"
     */
    version: string;

    /**
     * An EpsgCode Enum representing a map sheet's projection.
     *
     * @example EpsgCode.Nztm2000 = 2193
     */
    'proj:epsg': EpsgCode;

    /**
     * The width of a map sheet in pixels.
     */
    'source.width': number;

    /**
     * The height of a map sheet in pixels.
     */
    'source.height': number;

    /**
     * An object of key-value pairs describing options for Basemaps' cogify process.
     */
    'linz_basemaps:options': { [key: string]: unknown };

    /**
     * An object of key-value pairs information for basemaps cli packages.
     */
    'linz_basemaps:generated': { [key: string]: unknown };
  };
}

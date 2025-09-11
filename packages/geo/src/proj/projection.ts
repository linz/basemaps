import {
  BBox,
  BBoxFeature,
  BBoxFeatureCollection,
  MultiPolygon,
  multiPolygonToWgs84,
  toFeatureMultiPolygon,
  toFeaturePolygon,
} from '@linzjs/geojson';
import { Position } from 'geojson';
import Proj from 'proj4';
import { PROJJSONDefinition } from 'proj4/dist/lib/core.js';

import { BoundingBox, NamedBounds } from '../bounds.js';
import { Epsg, EpsgCode } from '../epsg.js';
import { Tile, TileMatrixSet } from '../tile.matrix.set.js';
import { Citm2000Json } from './json/nz/citm2000.js';
import { Nztm2000Json } from './json/nz/nztm2000.js';

export const Projections = new Map<number | EpsgCode, { json?: PROJJSONDefinition; converter: proj4.Converter }>();

export interface LatLon {
  lat: number;
  lon: number;
}

function getEpsgCode(epsgCode?: Epsg | EpsgCode | TileMatrixSet): EpsgCode | null {
  if (epsgCode == null) return null;
  if (typeof epsgCode === 'number') return epsgCode;
  if ('code' in epsgCode) return epsgCode.code;
  if ('projection' in epsgCode) return epsgCode.projection.code;
  return null;
}

export class Projection {
  static All = new Map<EpsgCode, Projection>();

  /** If floating point numbers differ by this amount they are close enough */
  static AllowedFloatingError = 1e-8;

  /** EPSG code for the projection other than Epsg.Wgs84 */
  epsg: Epsg;

  /** Transform coordinates to and from Wgs84 */
  private projection: proj4.Converter;

  /** If the projection was definied with a projjson */
  definition?: PROJJSONDefinition;

  /**
   * Wrapper around TileMatrixSet with utilities for converting Points and Polygons
   */
  private constructor(epsg: Epsg, definition?: PROJJSONDefinition) {
    this.epsg = epsg;

    const projection = Projections.get(epsg.code);
    if (projection == null) {
      throw new Error(`Failed to create projection: ${epsg.toEpsgString()}, ${Epsg.Wgs84.toEpsgString()}`);
    }
    this.projection = projection.converter;
    this.definition = definition;
    Projection.All.set(epsg.code, this);
  }

  /** Ensure that a transformation in proj4.js is defined */
  static define(epsg: Epsg, def: PROJJSONDefinition): Projection {
    const existing = Projections.get(epsg.code);
    if (existing != null) throw new Error('Duplicate projection definition: ' + epsg.toEpsgString());
    Projections.set(epsg.code, { json: def, converter: Proj(def, Epsg.Wgs84.toEpsgString()) });
    return new Projection(epsg, def);
  }

  /**
   * Get the Projection instance for a specified code,
   *
   * throws a exception if the code is not recognized
   *
   * @param epsgCode
   */
  static get(epsgCode: Epsg | EpsgCode | TileMatrixSet): Projection {
    const proj = this.tryGet(epsgCode);
    if (proj == null) throw new Error(`Invalid projection: ${getEpsgCode(epsgCode)}`);
    return proj;
  }

  /**
   * Try to find a corresponding Projection for a number
   * @param epsgCode
   */
  static tryGet(unk?: Epsg | EpsgCode | TileMatrixSet): Projection | null {
    const epsgCode = getEpsgCode(unk);
    if (epsgCode == null) return null;
    // Existing projection logic, cache and reuse
    const proj = Projection.All.get(epsgCode);
    if (proj != null) return proj;
    // ensure the EPSG Code has been registered in basemaps
    const epsg = Epsg.tryGet(epsgCode);
    if (epsg == null) return null;
    // Ensure proj has a transform for this projection
    const def = Projections.get(epsg.code);
    if (def == null) return null;

    return new Projection(epsg);
  }

  /**
   * Project the points in a MultiPolygon array to the `targetProjection`.
   *
   * @return if multipoly is not projected return it verbatim otherwise creates a new multi
   * polygon
   */
  projectMultipolygon(multipoly: Position[][][], targetProjection: Projection): Position[][][] {
    if (targetProjection.epsg.code === this.epsg.code) return multipoly;

    const { toWgs84 } = this;
    const { fromWgs84 } = targetProjection;

    return multipoly.map((poly) => poly.map((ring) => ring.map((p) => fromWgs84(toWgs84(p)))));
  }

  /**
   * Convert source `[x, y]` coordinates to `[lon, lat]`
   */
  get toWgs84(): (coordinates: Position) => Position {
    return this.projection.forward;
  }

  /**
   * Convert `[lon, lat]` coordinates to source `[x, y]`
   */
  get fromWgs84(): (coordinates: Position) => Position {
    return this.projection.inverse;
  }

  /**
   * Convert a source Bounds to GeoJSON WGS84 BoundingBox. In particular if the bounds crosses the
   * anti-meridian then the east component will be less than the west component.
   *
   * @param source
   * @returns [west, south, east, north]
   */
  boundsToWgs84BoundingBox(source: BoundingBox): BBox {
    const sw = this.toWgs84([source.x, source.y]);
    const ne = this.toWgs84([source.x + source.width, source.y + source.height]);

    return [sw[0], sw[1], ne[0], ne[1]];
  }

  /**
   * Convert a source bounds to a WSG84 GeoJSON Feature
   *
   * @param bounds in source epsg
   * @param properties any properties to include in the feature such as name
   *
   * @returns If `bounds` crosses the antimeridian then and east and west pair of non crossing
   * polygons will be returned; otherwise a single Polygon will be returned.
   */
  boundsToGeoJsonFeature(bounds: BoundingBox, properties = {}): BBoxFeature {
    const sw = [bounds.x, bounds.y];
    const se = [bounds.x + bounds.width, bounds.y];
    const nw = [bounds.x, bounds.y + bounds.height];
    const ne = [bounds.x + bounds.width, bounds.y + bounds.height];

    const coords = multiPolygonToWgs84([[[sw, nw, ne, se, sw]]] as MultiPolygon, this.toWgs84);

    const feature =
      coords.length === 1 ? toFeaturePolygon(coords[0], properties) : toFeatureMultiPolygon(coords, properties);
    feature.bbox = this.boundsToWgs84BoundingBox(bounds);

    return feature as BBoxFeature;
  }

  /** Convert a tile covering to a GeoJSON FeatureCollection */
  toGeoJson(files: NamedBounds[]): BBoxFeatureCollection {
    return {
      type: 'FeatureCollection',
      features: files.map((f) => this.boundsToGeoJsonFeature(f, { name: f.name })),
    };
  }

  /**
   * Find the closest zoom level to `pixelScale` that is at
   * least as good as `pixelScale` or within the error bounds (+- 1e-8)
   *
   * @see Projection.AllowedFloatingError.
   *
   * @param pixelScale A pixel's resolution in metres
   */
  static getTiffResZoom(tms: TileMatrixSet, pixelScale: number): number {
    for (let z = 0; z < tms.zooms.length; z++) {
      const diff = tms.pixelScale(z) - pixelScale;
      if (diff < this.AllowedFloatingError) return z;
    }
    return tms.zooms.length - 1;
  }

  /** Convert a tile to the wgs84 bounds */
  static tileToWgs84Bbox(tms: TileMatrixSet, tile: Tile): BBox {
    const ul = tms.tileToSource(tile);
    const lr = tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });

    const proj = this.get(tms);

    const [swLon, swLat] = proj.toWgs84([ul.x, lr.y]);
    const [neLon, neLat] = proj.toWgs84([lr.x, ul.y]);

    return [swLon, swLat, neLon, neLat];
  }

  /**
   * return the `lat`, `lon` of a Tile's center
   */
  static tileCenterToLatLon(tms: TileMatrixSet, tile: Tile): LatLon {
    const point = tms.tileToSource({ x: tile.x + 0.5, y: tile.y + 0.5, z: tile.z });
    const [lon, lat] = this.get(tms).toWgs84([point.x, point.y]);

    return Projection.wrapLatLon(lat, lon);
  }

  /**
   * Reused from : https://github.com/pelias/api/blob/6a7751f35882698eb885b93635656ec0c2941633/sanitizer/wrap.js
   *
   * Normalize co-ordinates that lie outside of the normal ranges.
   *
   * longitude wrapping simply requires adding +- 360 to the value until it comes in to range.
   * for the latitude values we need to flip the longitude whenever the latitude
   * crosses a pole.
   *
   */
  static wrapLatLon(lat: number, lon: number): LatLon {
    const point = { lat, lon };
    const quadrant = Math.floor(Math.abs(lat) / 90) % 4;
    const pole = lat > 0 ? 90 : -90;
    const offset = lat % 90;

    switch (quadrant) {
      case 0:
        point.lat = offset;
        break;
      case 1:
        point.lat = pole - offset;
        point.lon += 180;
        break;
      case 2:
        point.lat = -offset;
        point.lon += 180;
        break;
      case 3:
        point.lat = -pole + offset;
        break;
    }

    if (point.lon > 180 || point.lon < -180) {
      point.lon -= Math.floor((point.lon + 180) / 360) * 360;
    }

    return point;
  }

  /**
   * Find the number of alignment levels required to render the tile. Min 0
   *
   * @param tile
   * @param gsd the pixel resolution of the source imagery
   */
  static findAlignmentLevels(tms: TileMatrixSet, tile: Tile, gsd: number, blockFactor = 2): number {
    return Math.max(0, this.getTiffResZoom(tms, gsd * blockFactor) - tile.z);
  }

  /**
   * Return the expected width in pixels of an image at the tile resolution.
   *
   * @param tile
   * @param targetZoom The desired zoom level for the imagery
   */
  static getImagePixelWidth(tms: TileMatrixSet, tile: Tile, targetZoom: number): number {
    const ul = tms.tileToSource(tile);
    const lr = tms.tileToSource({ x: tile.x + 1, y: tile.y + 1, z: tile.z });
    return Math.round((lr.x - ul.x) / tms.pixelScale(targetZoom)) * 2;
  }
}

Projection.define(Epsg.Nztm2000, Nztm2000Json);
Projection.define(Epsg.Citm2000, Citm2000Json);
Projections.set(Epsg.Google.code, { converter: Proj(Epsg.Google.toEpsgString(), Epsg.Wgs84.toEpsgString()) });
Projections.set(Epsg.Wgs84.code, { converter: Proj(Epsg.Wgs84.toEpsgString(), Epsg.Wgs84.toEpsgString()) });

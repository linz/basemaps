import { Epsg, EpsgCode } from '../epsg.js';
import { TileMatrixSet } from '../tile.matrix.set.js';
import { Mslc2000Tms } from './antarctic/mslc2000.js';
import { GoogleTms } from './global/google.js';
import { Citm2000Tms } from './new-zealand/citm2000.js';
import { Nztm2000QuadTms, Nztm2000Tms } from './new-zealand/nztm2000.js';
import { Aitm2000Tms } from './new-zealand-offshore-islands/aitm2000.js';
import { Aktm2000Tms } from './new-zealand-offshore-islands/aktm2000.js';
import { Catm2000Tms } from './new-zealand-offshore-islands/catm2000.js';
import { Ritm2000Tms } from './new-zealand-offshore-islands/ritm2000.js';
import { Utm2sTms } from './pacific-islands/utm2s.js';
import { Utm3sTms } from './pacific-islands/utm3s.js';
import { Utm4sTms } from './pacific-islands/utm4s.js';

export type Nullish = null | undefined;

export const TileMatrixSets = {
  /** All TileMatrixSets that are currently supported */
  All: [
    // global
    GoogleTms,
    // antarctic
    Mslc2000Tms,
    // new zealand
    Nztm2000Tms,
    Nztm2000QuadTms,
    Citm2000Tms,
    // new zealand offshore islands
    Aktm2000Tms,
    Catm2000Tms,
    Aitm2000Tms,
    Ritm2000Tms,
    // pacific islands
    Utm2sTms,
    Utm3sTms,
    Utm4sTms,
  ],

  /** Default mapping of EPSG code to Tile matrix set */
  Defaults: new Map([
    // global
    [Epsg.Google.code, GoogleTms],
    // antarctic
    [EpsgCode.Mslc2000, Mslc2000Tms],
    // new zealand
    [Epsg.Nztm2000.code, Nztm2000Tms],
    [Epsg.Citm2000.code, Citm2000Tms],
    // new zealand offshore islands
    [EpsgCode.Aktm2000, Aktm2000Tms],
    [EpsgCode.Catm2000, Catm2000Tms],
    [EpsgCode.Aitm2000, Aitm2000Tms],
    [EpsgCode.Ritm2000, Ritm2000Tms],
    // pacific islands
    [EpsgCode.Utm2s, Utm2sTms],
    [EpsgCode.Utm3s, Utm3sTms],
    [EpsgCode.Utm4s, Utm4sTms],
  ]),

  /**
   * Get a tile matrix set by EPSG Code
   * @throws if no default mapping is made
   */
  get(epsg: Epsg | EpsgCode): TileMatrixSet {
    const tms = this.tryGet(epsg);
    if (tms == null) throw new Error('Failed to lookup TileMatrixSet: ' + String(epsg));
    return tms;
  },

  /** Attempt to find a mapping from a EPSG code to a default tile matrix set  */
  tryGet(epsg?: Epsg | EpsgCode | Nullish): TileMatrixSet | null {
    if (epsg == null) return null;
    if (typeof epsg === 'number') return this.Defaults.get(epsg) ?? null;
    return this.Defaults.get(epsg.code) ?? null;
  },

  /**
   * Find a tile matrix set given a identifier or epsg string
   * @param identifier Tile matrix set identifier
   * @param caseSensitive Should this compare case sensitively
   */
  find(identifier: string | Nullish, caseSensitive = true): TileMatrixSet | null {
    if (identifier == null) return null;
    const epsg = Epsg.parse(identifier);
    if (epsg != null) return TileMatrixSets.tryGet(epsg);
    if (caseSensitive) {
      for (const tileMatrix of TileMatrixSets.All) {
        if (tileMatrix.identifier === identifier) return tileMatrix;
      }
      return null;
    }
    for (const tileMatrix of TileMatrixSets.All) {
      if (tileMatrix.identifier.toLowerCase() === identifier.toLowerCase()) return tileMatrix;
    }
    return null;
  },
};

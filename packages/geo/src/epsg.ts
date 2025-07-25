/** EPSG codes for commonly used projections */
export enum EpsgCode {
  // Global

  /** Pseudo-Mercator */
  Google = 3857,
  /** World Geodetic System 1984 */
  Wgs84 = 4326,

  // Antarctic

  /** McMurdo Sound Lambert Conformal */
  Mslc2000 = 5479,

  // New Zealand

  /** New Zealand Transverse Mercator */
  Nztm2000 = 2193,
  /** Chatham Islands Transverse Mercator */
  Citm2000 = 3793,

  // New Zealand Offshore Islands

  /** Auckland Islands Transverse Mercator */
  Aktm2000 = 3788,
  /** Campbell Island Transverse Mercator */
  Catm2000 = 3789,
  /** Antipodes Islands Transverse Mercator */
  Aitm2000 = 3790,
  /** Raoul Island Transverse Mercator */
  Ritm2000 = 3791,

  // Pacific Islands

  /** Universal Transverse Mercator Zone 2s */
  Utm2s = 32702,
  /** Universal Transverse Mercator Zone 3s */
  Utm3s = 32703,
  /** Universal Transverse Mercator Zone 4s */
  Utm4s = 32704,
}

const EPSGTextMap: Record<string, EpsgCode> = {
  // Global
  google: EpsgCode.Google,
  epsg3857: EpsgCode.Google,
  [EpsgCode.Google]: EpsgCode.Google,
  globalmercator: EpsgCode.Google,

  wgs84: EpsgCode.Wgs84,
  epsg4326: EpsgCode.Wgs84,
  [EpsgCode.Wgs84]: EpsgCode.Wgs84,

  // Antarctic
  [EpsgCode.Mslc2000]: EpsgCode.Mslc2000,

  // New Zealand
  nztm: EpsgCode.Nztm2000,
  epsg2193: EpsgCode.Nztm2000,
  [EpsgCode.Nztm2000]: EpsgCode.Nztm2000,
  nztm2000: EpsgCode.Nztm2000,

  citm: EpsgCode.Citm2000,
  epsg3793: EpsgCode.Citm2000,
  [EpsgCode.Citm2000]: EpsgCode.Citm2000,
  citm2000: EpsgCode.Citm2000,

  // New Zealand Offshore Islands
  [EpsgCode.Aktm2000]: EpsgCode.Aktm2000,
  [EpsgCode.Catm2000]: EpsgCode.Catm2000,
  [EpsgCode.Aitm2000]: EpsgCode.Aitm2000,
  [EpsgCode.Ritm2000]: EpsgCode.Ritm2000,

  // Pacific Islands
  [EpsgCode.Utm2s]: EpsgCode.Utm2s,
  [EpsgCode.Utm3s]: EpsgCode.Utm3s,
  [EpsgCode.Utm4s]: EpsgCode.Utm4s,
};

export class Epsg {
  static Codes = new Map<number, Epsg>();

  static Google = new Epsg(EpsgCode.Google);
  static Wgs84 = new Epsg(EpsgCode.Wgs84);
  static Mslc2000 = new Epsg(EpsgCode.Mslc2000);
  static Nztm2000 = new Epsg(EpsgCode.Nztm2000);
  static Citm2000 = new Epsg(EpsgCode.Citm2000);
  static Aktm2000 = new Epsg(EpsgCode.Aktm2000);
  static Catm2000 = new Epsg(EpsgCode.Catm2000);
  static Aitm2000 = new Epsg(EpsgCode.Aitm2000);
  static Ritm2000 = new Epsg(EpsgCode.Ritm2000);
  static Utm2s = new Epsg(EpsgCode.Utm2s);
  static Utm3s = new Epsg(EpsgCode.Utm3s);
  static Utm4s = new Epsg(EpsgCode.Utm4s);

  code: EpsgCode;
  constructor(code: EpsgCode) {
    this.code = code;
    if (Epsg.Codes.has(code)) throw new Error(`Duplicate EPSG code created: ${code}`);
    Epsg.Codes.set(this.code, this);
  }

  /**  */
  toString(): string {
    return this.code.toString();
  }

  /** Override JSON output to output just the EpsgCode */
  toJSON(): number {
    return this.code;
  }

  /**
   * Convert a EPSG code into "EPSG:<code>""
   * @example "EPSG:2193"
   */
  toEpsgString(): string {
    return `EPSG:${this.code}`;
  }

  /**
   * convert a EPSG code into a URN
   * @example "urn:ogc:def:crs:EPSG::2193"
   */
  toUrn(): string {
    return `urn:ogc:def:crs:EPSG::${this.code}`;
  }

  /**
   * Get the EPSG instance for a specified code,
   *
   * throws a exception if the code is not recognized
   *
   * @param code
   */
  public static get(code: EpsgCode): Epsg {
    const epsg = Epsg.Codes.get(code);
    if (epsg == null) throw new Error(`Invalid EPSG:${code}`);
    return epsg;
  }

  /**
   * Try to find a corresponding epsg code for a number
   * @param code
   */
  public static tryGet(code?: number): Epsg | undefined {
    if (code == null) return;
    return Epsg.Codes.get(code);
  }

  /** parse a string returning the raw EpsgCode **/
  public static parseCode(text: string): EpsgCode | null {
    if (text.startsWith('urn:')) return EPSGTextMap[text.slice(text.lastIndexOf(':') + 1)];
    if (text.startsWith('https://')) return EPSGTextMap[text.slice(text.lastIndexOf('/') + 1)];
    return EPSGTextMap[text.replace(/[\W_]/g, '').toLowerCase()] ?? null;
  }

  public static parse(text: string): Epsg | null {
    const code = Epsg.parseCode(text);
    if (code == null) return null;
    return Epsg.get(code);
  }
}

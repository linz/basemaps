/** EPSG codes for commonly used projections */
export enum EpsgCode {
  /** Pseudo WebMercator */
  Google = 3857,
  Wgs84 = 4326,
  /** New Zealand transverse mercator */
  Nztm2000 = 2193,
  /** Chatham Islands transverse mercator */
  Citm2000 = 3793,
}

const EPSGTextMap: Record<string, EpsgCode> = {
  google: EpsgCode.Google,
  epsg3857: EpsgCode.Google,
  [EpsgCode.Google]: EpsgCode.Google,
  globalmercator: EpsgCode.Google,

  wgs84: EpsgCode.Wgs84,
  epsg4326: EpsgCode.Wgs84,
  [EpsgCode.Wgs84]: EpsgCode.Wgs84,

  nztm: EpsgCode.Nztm2000,
  epsg2193: EpsgCode.Nztm2000,
  [EpsgCode.Nztm2000]: EpsgCode.Nztm2000,
  nztm2000: EpsgCode.Nztm2000,

  citm: EpsgCode.Citm2000,
  epsg3793: EpsgCode.Citm2000,
  [EpsgCode.Citm2000]: EpsgCode.Citm2000,
  citm2000: EpsgCode.Citm2000,
};

export class Epsg {
  static Codes = new Map<number, Epsg>();

  static Google = new Epsg(EpsgCode.Google);
  static Wgs84 = new Epsg(EpsgCode.Wgs84);
  static Nztm2000 = new Epsg(EpsgCode.Nztm2000);
  static Citm2000 = new Epsg(EpsgCode.Citm2000);

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

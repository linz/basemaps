// ByDirectory {
//   all: {
//     [epsg: string]: {
//       [mapCode: string]: T[]
//     }
//   },
//   latest: {
//     [epsg: string]: {
//       [mapCode: string]: T
//     }
//   }
// }
export class ByDirectory<T> {
  readonly all: ByEpsg<T[]>;
  readonly latest: ByEpsg<T>;

  constructor() {
    this.all = new ByEpsg<T[]>();
    this.latest = new ByEpsg<T>();
  }

  toJSON(): object {
    return {
      all: this.all.toJSON(),
      latest: this.latest.toJSON(),
    };
  }
}

// ByEpsg<T> {
//   [epsg: string]: {
//     [mapCode: string]: T
//   }
// }
class ByEpsg<T> {
  private readonly items: { [epsg: string]: ByMapCode<T> };

  constructor() {
    this.items = {};
  }

  get(epsg: string): ByMapCode<T> {
    let result = this.items[epsg];

    if (result !== undefined) return result;

    result = new ByMapCode<T>();
    this.items[epsg] = result;

    return result;
  }

  /**
   * @returns [epsg, ByMapCode<T>][]
   */
  entries(): [string, ByMapCode<T>][] {
    return Object.entries(this.items);
  }

  toJSON(): object {
    return Object.entries(this.items).reduce((obj, [epsg, byMapCode]) => ({ ...obj, [epsg]: byMapCode.toJSON() }), {});
  }
}

// ByMapCode<T> {
//   [mapCode: string]: T
// }
class ByMapCode<T> {
  private readonly items: { [mapCode: string]: T };

  constructor() {
    this.items = {};
  }

  /**
   * @param mapCode: the map code to lookup
   * @param defaultValue: the value to set and return if no value is found for the given map code
   *
   * @returns the value for the given map code, otherwise, the default value
   * @throws {Error} if no value is found for the given map code and no default value is provided.
   */
  get(mapCode: string, defaultValue?: T): T {
    let result = this.items[mapCode];

    if (result !== undefined) return result;
    if (defaultValue === undefined) {
      throw new Error(`No value found for map code '${mapCode}'`);
    }

    result = defaultValue;
    this.items[mapCode] = result;

    return result;
  }

  set(mapCode: string, value: T): void {
    this.items[mapCode] = value;
  }

  /**
   * @returns [mapCode, T][]
   */
  entries(): [string, T][] {
    return Object.entries(this.items);
  }

  toJSON(): object {
    return Object.entries(this.items).reduce((obj, [mapCode, value]) => ({ ...obj, [mapCode]: value }), {});
  }
}

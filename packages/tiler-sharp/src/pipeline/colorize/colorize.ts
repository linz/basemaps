export interface Colorizer {
  /**
   * create a RGBA color for a given value, then set the RGBA at the target offset
   *
   * @param val Data value
   * @param data pixel data to set the color in
   * @param targetOffset Offset to set the color at
   */
  set(val: number, data: Uint8ClampedArray, targetOffset: number): void;
}

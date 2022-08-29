export const FileSizeMap = new Map<string, number>([
  ['kb', 1024],
  ['mb', 1024 * 1024],
  ['gb', 1024 * 1024 * 1024],
  ['tb', 1024 * 1024 * 1024 * 1024],
  ['ki', 1000],
  ['mi', 1000 * 1000],
  ['gi', 1000 * 1000 * 1000],
  ['ti', 1000 * 1000 * 1000 * 1000],
]);

/**
 * Convert a number eg "1KB" to size in bytes (1024)
 *
 * Rounded to the nearest byte
 */
export function parseSize(size: string): number {
  const textString = size.toLowerCase().replace(/ /g, '').trim();
  if (textString.endsWith('i') || textString.endsWith('b')) {
    const lastVal = textString.slice(textString.length - 2);
    const denominator = FileSizeMap.get(lastVal);
    if (denominator == null) throw new Error(`Failed to parse: ${size} as a file size`);
    return Math.round(denominator * Number(textString.slice(0, textString.length - 2)));
  }
  const fileSize = Number(textString);
  if (isNaN(fileSize)) throw new Error(`Failed to parse: ${size} as a file size`);
  return Math.round(fileSize);
}

/** Ensure GSDs are listed with a "." not "-" eg 0-10m to 0.10m */
function fixChunkGsd(chunk: string): string | null {
  if (!chunk.endsWith('m')) return null;
  if (!chunk.includes('-')) return null;
  const num = Number(chunk.replace('-', '.').slice(0, chunk.length - 1));
  if (isNaN(num)) return null;
  return String(num) + 'm';
}
/** convert a 2022-23 year into a full year 2022-2023 */
function fixYear(chunk: string): string | null {
  const parts = chunk.split('-');
  if (parts.length !== 2) return null;
  if (parts[0].length !== 4) return null;
  if (parts[1].length === 4) return chunk; // 2022-2023
  // 2022-23
  if (parts[1].length === 2) return `${parts[0]}-${parts[0].slice(0, 2)}${parts[1]}`; // 2022-2023
  return null;
}

const chunkFixes = [fixChunkGsd, fixYear];

export function standardizeLayerName(name: string): string {
  const chunks = new Set(name.split('_'));
  // Remove RGBA/RGBI etc..
  chunks.delete('RGB');
  chunks.delete('RGBI');
  chunks.delete('RGBA');

  const output = [];
  for (const chunk of chunks) {
    let fixed = false;
    for (const fixer of chunkFixes) {
      const ret = fixer(chunk);
      if (ret == null) continue;
      fixed = true;
      output.push(ret);
      break;
    }

    if (!fixed) output.push(chunk);
  }

  return output.join('-');
}

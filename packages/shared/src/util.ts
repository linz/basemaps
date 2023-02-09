interface Named {
  name: string;
}

export function compareName(a: Named, b: Named): number {
  return a.name.localeCompare(b.name);
}

/**
 * Make a tile imagery name nicer to display as a Title
 * @example
 *  'tasman_rural_2018-19_0-3m' => 'Tasman rural 2018-19 0.3m'
 */
export function titleizeImageryName(name: string): string {
  return (
    name[0].toUpperCase() +
    name
      .slice(1)
      .replace(/_(\d+)-(\d+)m/g, ' $1.$2m')
      .replace(/_/g, ' ')
  );
}

/**
 * Attempt to parse a year from a imagery name
 * @example wellington_urban_2017_0.10m -> 2017
 * @param name Imagery name to parse
 * @return imagery year, null for failure to parse
 */
export function extractYearRangeFromName(name: string): null | [number, number] {
  const re = /(?:^|\D)(\d{4})(?:-(\d{2}))?(?:$|\D)/g;

  const years: number[] = [];

  for (let m = re.exec(name); m != null; m = re.exec(name)) {
    years.push(parseInt(m[1]));
    if (m[2] != null) years.push(parseInt(m[1].slice(0, 2) + m[2]));
  }

  if (years.length === 0) null;

  years.sort();

  return [years[0], years[years.length - 1] + 1];
}

export function extractYearRangeFromTitle(t: string): [number] | [number, number] | null {
  const yearChunk = t.slice(t.lastIndexOf(' ') + 1).trim(); // "(2019)" or "(2019-2020)"
  if (yearChunk == null) return null;
  if (!yearChunk.endsWith(')') || !yearChunk.startsWith('(')) return null;

  const chunks = yearChunk
    .slice(1, yearChunk.length - 1)
    .split('-')
    .map(Number);
  if (chunks.length === 1 && !isNaN(chunks[0])) return chunks as [number];
  else if (chunks.length === 2 && !isNaN(chunks[0]) && !isNaN(chunks[1])) return chunks as [number, number];
  return null;
}

export function s3ToVsis3(name: string): string {
  return name.startsWith('s3://') ? '/vsis3/' + name.slice('s3://'.length) : name;
}

/** Extract the hostname from a url */
export function getUrlHost(ref: string | undefined): string | undefined {
  if (ref == null) return ref;
  try {
    const { hostname } = new URL(ref);
    if (hostname == null) return ref;
    if (hostname.startsWith('www.')) return hostname.slice(4);
    return hostname;
  } catch (e) {
    // Ignore
  }
  return ref;
}

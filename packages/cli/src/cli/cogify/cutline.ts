const UrbanRuralCutLine = {
  href: 's3://linz-basemaps-source/cutline/2020-05-07-cutline-nz-coasts-rural-and-urban.geojson',
  blend: 20,
};

const DefaultCutlines = [
  {
    filter: 'sentinel',
    cutline: { href: 's3://linz-basemaps-source/cutline/2020-05-12-cutline-nz-ci.geojson.gz', blend: 5 },
  },
  {
    filter: 'chatham',
    cutline: { href: 's3://linz-basemaps-source/cutline/2020-05-12-cutline-nz-ci.geojson.gz', blend: 5 },
  },
  {
    filter: 'geographx',
    cutline: {
      href: 's3://linz-basemaps-source/cutline/2021-11-10-cutline-51153-nz-coastlines-and-islands-polygons-topo-150k.geojson.gz',
      blend: 0,
    },
  },
  {
    filter: 'topo50',
    cutline: { href: 's3://linz-basemaps-source/cutline/2020-08-10-cutline-topo50.geojson.gz', blend: 0 },
  },

  { filter: 'satellite', cutline: UrbanRuralCutLine },
  { filter: 'urban', cutline: UrbanRuralCutLine },
  { filter: 'rural', cutline: UrbanRuralCutLine },
];

export function getCutline(imageryName = ''): { href: string; blend: number } | undefined {
  return DefaultCutlines.find((f) => imageryName.toLowerCase().includes(f.filter))?.cutline;
}

import { MultiPolygon, Polygon } from '../types.js';

export function multiPolygonArea(mp: MultiPolygon): number {
  let total = 0;
  for (const p of mp) total += polygonArea(p);
  return total;
}

function polygonArea(p: Polygon): number {
  const ring = p[0];
  let total = 0;
  for (let i = 0; i < ring.length - 1; i++) total += ring[i][0] * ring[i + 1][1] - ring[i][1] * ring[i + 1][0];

  for (let poly = 1; poly < p.length; poly++) {
    const ring = p[poly];
    for (let i = 0; i < ring.length - 1; i++) total -= ring[i][0] * ring[i + 1][1] - ring[i][1] * ring[i + 1][0];
  }

  return total / 2;
}

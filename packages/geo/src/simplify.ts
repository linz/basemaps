import { Area, MultiPolygon, Pair } from '@linzjs/geojson';

// square distance between 2 points
function getDistance(p1: Pair, p2: Pair): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];

  return dx * dx + dy * dy;
}

// square distance from a point to a segment
function getSqSegDist(p: Pair, p1: Pair, p2: Pair): number {
  let x = p1[0];
  let y = p1[1];
  let dx = p2[0] - x;
  let dy = p2[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;

  return dx * dx + dy * dy;
}

// basic distance-based simplification
function simplifyRadialDist(points: Pair[], sqTolerance: number): Pair[] {
  let prevPoint = points[0];
  let point: Pair = points[1];
  const newPoints = [prevPoint];

  for (let i = 1, len = points.length; i < len; i++) {
    point = points[i];

    if (getDistance(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (prevPoint !== point) newPoints.push(point);

  return newPoints;
}

function simplifyDPStep(points: Pair[], first: number, last: number, sqTolerance: number, simplified: Pair[]): void {
  let maxSqDist = sqTolerance;
  let index = 0;

  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[first], points[last]);

    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
    simplified.push(points[index]);
    if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
  }
}

// simplification using Ramer-Douglas-Peucker algorithm
function simplifyDouglasPeucker(points: Pair[], sqTolerance: number): Pair[] {
  const last = points.length - 1;

  const simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);

  return simplified;
}

export const Simplify = {
  points(points: Pair[], tolerance: number, highestQuality?: boolean): Pair[] {
    if (points.length <= 2) return points;

    const sqTolerance = tolerance * tolerance;

    points = highestQuality ? points : simplifyRadialDist(points, sqTolerance);
    points = simplifyDouglasPeucker(points, sqTolerance);

    return points;
  },
  multiPolygon(coordinates: MultiPolygon, tolerance: number, removeArea = 1e-8): MultiPolygon | null {
    const output: MultiPolygon = [];
    for (let k = 0; k < coordinates.length; k++) {
      const outPoints = [];
      for (let l = 0; l < coordinates[k].length; l++) {
        const point = Simplify.points(coordinates[k][l], tolerance);
        if (point.length > 2) outPoints.push(point);
      }
      if (outPoints.length > 0) {
        // Skip any polygons that is less than removeArea size
        if (removeArea > 0 && Area.polygon(outPoints) < removeArea) continue;
        output.push(outPoints);
      }
    }
    if (output.length === 0) return null;

    return output;
  },
};

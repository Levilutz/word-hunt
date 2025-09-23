import type { PointData } from "pixi.js";

/** Return a - b */
export function pointSub(a: PointData, b: PointData): PointData {
  return { x: a.x - b.x, y: a.y - b.y };
}

/** Scale a vec. */
export function pointScale(v: PointData, s: number): PointData {
  return { x: v.x * s, y: v.y * s };
}

/** Round a vec down to the nearest integer values. */
export function pointFloor(v: PointData): PointData {
  return { x: Math.floor(v.x), y: Math.floor(v.y) };
}

/** Return whether the given point is in the given rect, inclusive of `min` and exclusive of `max`. */
export function pointInRect(
  p: PointData,
  min: PointData,
  max: PointData,
): boolean {
  return p.x >= min.x && p.x < max.x && p.y >= min.y && p.y < max.y;
}

/** Get the distance squared between two points. */
export function distanceSquared(p1: PointData, p2: PointData): number {
  return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;
}

/** Given points a and b and a scalar param t, interpolate. */
export function interp(a: PointData, b: PointData, t: number): PointData {
  return { x: a.x * (1 - t) + b.x * t, y: a.y * (1 - t) + b.y * t };
}

/** Given a line (a -> b), and a third point c, what is the closest point on the line to c?
 *
 * @returns t - the scalar param on (a -> b)
 */
export function closestPointScalar(
  a: PointData,
  b: PointData,
  c: PointData,
): { t: number } {
  const num = (c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y);
  const denom = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  const t = num / denom;
  return { t };
}

/** Given a line (a -> b) and a circle with center c and radius r, does the line enter the circle.
 *
 * @returns t - the scalar param on (a -> b) that is closest to the circle, or undefined if no intersect.
 */
export function lineCircleIntersectionScalar(
  a: PointData,
  b: PointData,
  c: PointData,
  r: number,
): { t: number | undefined } {
  const { t } = closestPointScalar(a, b, c);
  if (t >= 0 && t <= 1 && distanceSquared(interp(a, b, t), c) <= r ** 2) {
    return { t };
  } else if (t < 0 && distanceSquared(a, c) <= r ** 2) {
    return { t: 0 };
  } else if (t > 1 && distanceSquared(b, c) <= r ** 2) {
    return { t: 1 };
  } else {
    return { t: undefined };
  }
}

/** Given a grid of tiles starting from (0, 0) of width `tilePx`,
 * which tile (x, y) does p intersect? Returns undefined if none. */
export function pointTileIntersection(
  p: PointData,
  tilePx: number,
): PointData | undefined {
  const ind = pointFloor(pointScale(p, 1 / tilePx));
  if (ind.x >= 0 && ind.y >= 0) {
    return ind;
  }
  return undefined;
}

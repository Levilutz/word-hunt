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

/** Thick raster a line over a grid of size 1x1.
 *
 * @returns index coords of pixels in order.
 */
export function thickRaster(a: PointData, b: PointData): PointData[] {
  const aFloor = pointFloor(a);
  const bFloor = pointFloor(b);
  const sx = b.x > a.x ? 1 : -1;
  const sy = b.y > a.y ? 1 : -1;
  // Degenerate case - vertical line
  if (Math.floor(a.x) === Math.floor(b.x)) {
    const out: PointData[] = [];
    let { x, y } = aFloor;
    while (true) {
      out.push({ x, y });
      if (y === bFloor.y) {
        break;
      }
      y += sy;
    }
    return out;
  }
  // All other lines
  const slope = (b.y - a.y) / (b.x - a.x);
  const out: PointData[] = [];
  let { x, y } = aFloor;
  while (true) {
    const endX = sx === 1 ? x + sx : x;
    const lastY = Math.floor((endX - a.x) * slope + a.y);
    while (true) {
      out.push({ x, y });
      if (y === lastY || y === bFloor.y) {
        break;
      }
      y += sy;
    }
    if (x === bFloor.x) {
      break;
    }
    x += sx;
  }
  return out;
}

/** Thick raster over a grid of circles of diameter 1.
 *
 * @returns index coords of circles in order.
 * */
export function thickRasterCircles(a: PointData, b: PointData): PointData[] {
  return thickRaster(a, b).filter(
    (pos) =>
      lineCircleIntersectionScalar(
        a,
        b,
        { x: pos.x + 0.5, y: pos.y + 0.5 },
        0.5,
      ).t !== undefined,
  );
}

/** Given some params about a field, get the tile px.
 *
 * @param totalSpace How many Px of space are available in total
 * @param usedPortion What portion of the space should be used? Counts from start of first tile to end of last tile.
 * @param spaceRatio What percent of the tilePx is the space between them?
 * @param numTiles How many tiles must fit in this space
 * @returns The size in Px of a single tile
 *
 * For example, `getTilePx(20, 0.7, 0.5, 5)` will return `2`. This can be visualized as:
 * ---||-||-||-||-||---
 *
 * Where `-` represents a space between tiles, and `|` represents a pixel that is part of a tile.
 */
export function getTilePx(
  totalSpace: number,
  usedPortion: number,
  spaceRatio: number,
  numTiles: number,
): number {
  return (
    (totalSpace * usedPortion) / (numTiles * spaceRatio - spaceRatio + numTiles)
  );
}

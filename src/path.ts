/**
 * OrgPad-style squircle path generator.
 *
 * Uses 3 cubic Bezier curves per corner (12 total) to approximate a
 * superellipse rounded rectangle. This produces smooth, Apple-like
 * "squircle" corners that CSS `border-radius` alone cannot achieve.
 *
 * Reference: https://orgpad.info/blog/squircles
 */

export interface SquircleRadii {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export type SquircleRadiusInput = number | SquircleRadii;

export interface SquirclePathOptions {
  width: number;
  height: number;
  /** Corner radius in px, as a single value or per-corner object. */
  radius: SquircleRadiusInput;
}

export interface SquircleUnitPathOptions {
  /**
   * Corner radius in normalized 0..1 space.
   *
   * A number is interpreted as a fraction of the shorter dimension, clamped
   * to 0..0.5. Per-corner values use the same normalized units.
   */
  radius: SquircleRadiusInput;
}

type Point = [number, number];
type CornerBezierSegment = [number, number, number, number, number, number];

// Normalized Bezier constants for the top-right corner in a unit square.
// Each segment is [cp1x, cp1y, cp2x, cp2y, endX, endY].
const CORNER_BEZIER: CornerBezierSegment[] = [
  [0.3, 0, 0.473, 0, 0.619, 0.039],
  [0.804, 0.088, 0.912, 0.196, 0.961, 0.381],
  [1, 0.527, 1, 0.7, 1, 1],
];

function formatNumber(value: number): string {
  const rounded = Number(value.toFixed(6));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function resolveRadii(input: SquircleRadiusInput): SquircleRadii {
  if (typeof input === "number") {
    return {
      topLeft: input,
      topRight: input,
      bottomRight: input,
      bottomLeft: input,
    };
  }

  return input;
}

function clampRadii(radii: SquircleRadii, width: number, height: number): SquircleRadii {
  const maxRadius = Math.min(width, height) / 2;
  let { topLeft, topRight, bottomRight, bottomLeft } = radii;

  topLeft = Math.max(0, Math.min(topLeft, maxRadius));
  topRight = Math.max(0, Math.min(topRight, maxRadius));
  bottomRight = Math.max(0, Math.min(bottomRight, maxRadius));
  bottomLeft = Math.max(0, Math.min(bottomLeft, maxRadius));

  const scaleEdge = (first: number, second: number, edgeLength: number): [number, number] => {
    const sum = first + second;
    if (sum > edgeLength && sum > 0) {
      const scale = edgeLength / sum;
      return [first * scale, second * scale];
    }

    return [first, second];
  };

  [topLeft, topRight] = scaleEdge(topLeft, topRight, width);
  [topRight, bottomRight] = scaleEdge(topRight, bottomRight, height);
  [bottomRight, bottomLeft] = scaleEdge(bottomRight, bottomLeft, width);
  [bottomLeft, topLeft] = scaleEdge(bottomLeft, topLeft, height);

  return { topLeft, topRight, bottomRight, bottomLeft };
}

function transformCornerPoint(
  normalizedX: number,
  normalizedY: number,
  cornerIndex: number,
  radius: number,
  width: number,
  height: number,
): Point {
  switch (cornerIndex) {
    case 0:
      return [normalizedY * radius, radius * (1 - normalizedX)];
    case 1:
      return [width - radius + normalizedX * radius, normalizedY * radius];
    case 2:
      return [width - normalizedY * radius, height - radius + normalizedX * radius];
    case 3:
      return [radius * (1 - normalizedX), height - normalizedY * radius];
    default:
      return [normalizedX, normalizedY];
  }
}

function appendCorner(
  pathParts: string[],
  cornerIndex: number,
  radius: number,
  width: number,
  height: number,
): void {
  if (radius < 0.01) return;

  for (const [cp1x, cp1y, cp2x, cp2y, endX, endY] of CORNER_BEZIER) {
    const [control1X, control1Y] = transformCornerPoint(cp1x, cp1y, cornerIndex, radius, width, height);
    const [control2X, control2Y] = transformCornerPoint(cp2x, cp2y, cornerIndex, radius, width, height);
    const [absoluteEndX, absoluteEndY] = transformCornerPoint(endX, endY, cornerIndex, radius, width, height);
    pathParts.push(
      `C ${formatNumber(control1X)} ${formatNumber(control1Y)} ${formatNumber(control2X)} ${formatNumber(control2Y)} ${formatNumber(absoluteEndX)} ${formatNumber(absoluteEndY)}`,
    );
  }
}

/**
 * Generate an SVG path `d` string for a squircle-rounded rectangle.
 *
 * Coordinates are in user-space units matching the provided width and height.
 * Use the result in SVG `<path d="...">`, CSS `clip-path: path("...")`, or
 * Canvas `new Path2D(...)`.
 */
export function getSquirclePath(options: SquirclePathOptions): string {
  const { width, height } = options;
  if (width <= 0 || height <= 0) return "";

  const radii = clampRadii(resolveRadii(options.radius), width, height);

  if (
    radii.topLeft <= 0 &&
    radii.topRight <= 0 &&
    radii.bottomRight <= 0 &&
    radii.bottomLeft <= 0
  ) {
    return `M 0 0 L ${formatNumber(width)} 0 L ${formatNumber(width)} ${formatNumber(height)} L 0 ${formatNumber(height)} Z`;
  }

  const pathParts: string[] = [];
  pathParts.push(`M ${formatNumber(radii.topLeft)} 0`);

  pathParts.push(`L ${formatNumber(width - radii.topRight)} 0`);
  if (radii.topRight > 0) {
    appendCorner(pathParts, 1, radii.topRight, width, height);
  } else {
    pathParts.push(`L ${formatNumber(width)} 0`);
  }

  pathParts.push(`L ${formatNumber(width)} ${formatNumber(height - radii.bottomRight)}`);
  if (radii.bottomRight > 0) {
    appendCorner(pathParts, 2, radii.bottomRight, width, height);
  } else {
    pathParts.push(`L ${formatNumber(width)} ${formatNumber(height)}`);
  }

  pathParts.push(`L ${formatNumber(radii.bottomLeft)} ${formatNumber(height)}`);
  if (radii.bottomLeft > 0) {
    appendCorner(pathParts, 3, radii.bottomLeft, width, height);
  } else {
    pathParts.push(`L 0 ${formatNumber(height)}`);
  }

  pathParts.push(`L 0 ${formatNumber(radii.topLeft)}`);
  if (radii.topLeft > 0) {
    appendCorner(pathParts, 0, radii.topLeft, width, height);
  } else {
    pathParts.push("L 0 0");
  }

  pathParts.push("Z");
  return pathParts.join(" ");
}

/**
 * Generate a squircle path in normalized 0..1 coordinates.
 *
 * This is useful for SVG `<clipPath clipPathUnits="objectBoundingBox">`.
 */
export function getSquircleUnitPath(options: SquircleUnitPathOptions): string {
  return getSquirclePath({ width: 1, height: 1, radius: options.radius });
}

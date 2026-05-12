import { describe, expect, it } from "vitest";
import { getSquirclePath, getSquircleUnitPath } from "../src";

describe("getSquirclePath", () => {
  it("returns an empty string for invalid dimensions", () => {
    expect(getSquirclePath({ width: 0, height: 100, radius: 16 })).toBe("");
    expect(getSquirclePath({ width: 100, height: -1, radius: 16 })).toBe("");
  });

  it("returns a plain rectangle path when every radius is zero", () => {
    expect(getSquirclePath({ width: 200, height: 100, radius: 0 })).toBe(
      "M 0 0 L 200 0 L 200 100 L 0 100 Z",
    );
  });

  it("generates a deterministic golden path for uniform radii", () => {
    expect(getSquirclePath({ width: 200, height: 100, radius: 20 })).toBe(
      "M 20 0 L 180 0 C 186 0 189.46 0 192.38 0.78 C 196.08 1.76 198.24 3.92 199.22 7.62 C 200 10.54 200 14 200 20 L 200 80 C 200 86 200 89.46 199.22 92.38 C 198.24 96.08 196.08 98.24 192.38 99.22 C 189.46 100 186 100 180 100 L 20 100 C 14 100 10.54 100 7.62 99.22 C 3.92 98.24 1.76 96.08 0.78 92.38 C 0 89.46 0 86 0 80 L 0 20 C 0 14 0 10.54 0.78 7.62 C 1.76 3.92 3.92 1.76 7.62 0.78 C 10.54 0 14 0 20 0 Z",
    );
  });

  it("supports asymmetric per-corner radii", () => {
    const path = getSquirclePath({
      width: 160,
      height: 120,
      radius: {
        topLeft: 8,
        topRight: 16,
        bottomRight: 24,
        bottomLeft: 32,
      },
    });

    expect(path.startsWith("M 8 0 L 144 0")).toBe(true);
    expect(path).toContain("L 160 96");
    expect(path).toContain("L 32 120");
    expect(path).toContain("L 0 8");
  });

  it("clamps radii to half the shorter dimension", () => {
    const path = getSquirclePath({ width: 100, height: 40, radius: 80 });

    expect(path.startsWith("M 20 0 L 80 0")).toBe(true);
    expect(path).toContain("L 100 20");
    expect(path).toContain("L 20 40");
  });

  it("scales competing radii on the same edge", () => {
    const path = getSquirclePath({
      width: 80,
      height: 200,
      radius: {
        topLeft: 60,
        topRight: 60,
        bottomRight: 0,
        bottomLeft: 0,
      },
    });

    expect(path.startsWith("M 40 0 L 40 0")).toBe(true);
  });
});

describe("getSquircleUnitPath", () => {
  it("generates normalized 0..1 paths", () => {
    const path = getSquircleUnitPath({ radius: 0.25 });

    expect(path.startsWith("M 0.25 0 L 0.75 0")).toBe(true);
    expect(path).toContain("L 1 0.75");
    expect(path).toContain("L 0.25 1");
  });

  it("matches getSquirclePath with a 1x1 rectangle", () => {
    expect(getSquircleUnitPath({ radius: 0.2 })).toBe(
      getSquirclePath({ width: 1, height: 1, radius: 0.2 }),
    );
  });
});

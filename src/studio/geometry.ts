import * as THREE from "three";
export interface Opening {
  x: number;
  y: number;
  width: number;
  height: number;
  kind: "window" | "door" | "roll-up";
}
/** One corrugated mesh per wall; cells occupied by openings are omitted, never covered. */
export function corrugatedWall(
  width: number,
  height: number,
  openings: Opening[],
  depth = 0.017,
  pitch = 0.278,
) {
  const positions: number[] = [],
    uvs: number[] = [];
  const boundaries = [
    -width / 2,
    width / 2,
    ...openings.flatMap((o) => [o.x - o.width / 2, o.x + o.width / 2]),
  ].sort((a, b) => a - b);
  const ys = [
    0,
    height,
    ...openings.flatMap((o) => [o.y - o.height / 2, o.y + o.height / 2]),
  ].sort((a, b) => a - b);
  const profile = (x: number) => {
    const phase = ((x + width / 2) / pitch) % 1;
    return (
      depth *
      (phase < 0.18
        ? 0
        : phase < 0.32
          ? (phase - 0.18) / 0.14
          : phase < 0.68
            ? 1
            : phase < 0.82
              ? 1 - (phase - 0.68) / 0.14
              : 0)
    );
  };
  const quad = (points: number[][]) => {
    for (const i of [0, 1, 2, 0, 2, 3]) {
      positions.push(...points[i]);
      uvs.push((points[i][0] + width / 2) / 1.7, points[i][1] / 1.7);
    }
  };
  for (let ix = 0; ix < boundaries.length - 1; ix++)
    for (let iy = 0; iy < ys.length - 1; iy++) {
      const a = boundaries[ix],
        b = boundaries[ix + 1],
        low = ys[iy],
        high = ys[iy + 1];
      if (b - a < 0.0001 || high - low < 0.0001 || low < 0 || high > height)
        continue;
      if (
        openings.some(
          (o) =>
            Math.abs((a + b) / 2 - o.x) < o.width / 2 - 0.00001 &&
            Math.abs((low + high) / 2 - o.y) < o.height / 2 - 0.00001,
        )
      )
        continue;
      const samples = [a, b];
      for (
        let p = Math.floor((a + width / 2) / pitch) - 1;
        p <= Math.ceil((b + width / 2) / pitch);
        p++
      )
        for (const fraction of [0, 0.18, 0.32, 0.68, 0.82, 1]) {
          const x = -width / 2 + (p + fraction) * pitch;
          if (x > a + 0.00001 && x < b - 0.00001) samples.push(x);
        }
      samples.sort((x, y) => x - y);
      for (let i = 0; i < samples.length - 1; i++) {
        const x = samples[i],
          next = samples[i + 1];
        quad([
          [x, low, profile(x)],
          [next, low, profile(next)],
          [next, high, profile(next)],
          [x, high, profile(x)],
        ]);
      }
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}
export function physicalPlane(width: number, height: number, tileSize = 1.7) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i++)
    uv.setXY(
      i,
      (uv.getX(i) * width) / tileSize,
      (uv.getY(i) * height) / tileSize,
    );
  return geometry;
}

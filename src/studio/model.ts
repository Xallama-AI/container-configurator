import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { dimensions, StudioConfig, WINDOWS } from "./config";
import { corrugatedWall, Opening, physicalPlane } from "./geometry";
import { StudioAssets } from "./assets";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function buildContainer(config: StudioConfig, assets: StudioAssets) {
  const root = new THREE.Group();
  root.name = "ISO container";
  const {
    length: L,
    width: W,
    height: H,
    base: B,
    floor: F,
  } = dimensions(config);
  const paint = new THREE.MeshStandardMaterial({
    name: "painted-steel",
    color: config.color,
    roughness: 0.7,
    metalness: 0.24,
    bumpMap: assets.paintTexture(),
    bumpScale: 0.0006,
    roughnessMap: assets.paintTexture(),
    side: THREE.DoubleSide,
  });
  const frame = new THREE.MeshStandardMaterial({
    color: "#202628",
    roughness: 0.38,
    metalness: 0.7,
  });
  const chrome = new THREE.MeshStandardMaterial({
    color: "#b9c1bf",
    roughness: 0.27,
    metalness: 0.88,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: "#181b19",
    roughness: 0.8,
  });
  const white = new THREE.MeshStandardMaterial({
    color: "#efefea",
    roughness: 0.4,
    metalness: 0.1,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    name: "clear-architectural-glass",
    color: "#ffffff",
    metalness: 0,
    // Roughness selects blurred transmission mip levels. Polished panes use zero.
    roughness: 0,
    transmission: 1,
    transparent: false,
    opacity: 1,
    thickness: 0.006,
    ior: 1.52,
    envMapIntensity: 1,
    side: THREE.FrontSide,
  });
  const geometries = new Map<string, THREE.BufferGeometry>();
  const box = (
    group: THREE.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material = paint,
    bevel = false,
  ) => {
    const key = [w, h, d, bevel].join(":");
    if (!geometries.has(key))
      geometries.set(
        key,
        bevel
          ? new RoundedBoxGeometry(
              w,
              h,
              d,
              2,
              Math.min(0.008, w / 5, h / 5, d / 5),
            )
          : new THREE.BoxGeometry(w, h, d),
      );
    const mesh = new THREE.Mesh(geometries.get(key), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const pipe = (
    group: THREE.Object3D,
    r: number,
    height: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material = chrome,
  ) => {
    const key = `pipe:${r}:${height}`;
    if (!geometries.has(key))
      geometries.set(key, new THREE.CylinderGeometry(r, r, height, 10));
    const mesh = new THREE.Mesh(geometries.get(key), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
    return mesh;
  };
  // Eight corner castings with through-holes; dimensions approximate ISO 1161 fittings.
  const castingShape = new THREE.Shape();
  castingShape.moveTo(-0.089, -0.059);
  castingShape.lineTo(0.089, -0.059);
  castingShape.lineTo(0.089, 0.059);
  castingShape.lineTo(-0.089, 0.059);
  castingShape.closePath();
  const hole = new THREE.Path();
  hole.absellipse(0, 0, 0.035, 0.023, 0, Math.PI * 2, true, 0);
  castingShape.holes.push(hole);
  const castingGeometry = new THREE.ExtrudeGeometry(castingShape, {
    depth: 0.162,
    bevelEnabled: true,
    bevelSize: 0.003,
    bevelThickness: 0.003,
    bevelSegments: 1,
    steps: 1,
  });
  castingGeometry.translate(0, 0, -0.081);
  for (const x of [-L / 2 + 0.05, L / 2 - 0.05])
    for (const z of [-W / 2 + 0.035, W / 2 - 0.035]) {
      box(root, 0.14, H - 0.1, 0.13, x, B + H / 2, z, paint, true);
      for (const y of [B + 0.045, B + H - 0.04]) {
        const cast = new THREE.Mesh(castingGeometry, paint);
        cast.position.set(x, y, z);
        cast.castShadow = true;
        root.add(cast);
      }
      box(
        root,
        0.28,
        0.16,
        0.28,
        x,
        0.08,
        z,
        new THREE.MeshStandardMaterial({ color: "#c3c3b7", roughness: 0.98 }),
        true,
      );
    }
  for (const z of [-W / 2, W / 2]) {
    box(root, L - 0.18, 0.15, 0.1, 0, B + 0.08, z, paint, true);
    box(root, L - 0.18, 0.11, 0.11, 0, B + H - 0.045, z, paint, true);
  }
  for (const x of [-L / 2, L / 2]) {
    box(root, 0.1, 0.15, W - 0.2, x, B + 0.08, 0, paint, true);
    box(root, 0.1, 0.11, W - 0.2, x, B + H - 0.045, 0, paint, true);
  }
  box(root, L - 0.18, 0.13, W - 0.14, 0, F - 0.07, 0, frame);
  const floorMaterial = assets.pbr(
    `wood/${config.floor}`,
    config.floor === "dark-walnut" ? "#806451" : "#ffffff",
  );
  const floor = new THREE.Mesh(physicalPlane(L - 0.2, W - 0.15), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = F + 0.003;
  floor.receiveShadow = true;
  root.add(floor);
  const window = WINDOWS.find((w) => w.id === config.windowStyle)!;
  const windowW = Math.min(window.w, L * 0.32),
    windowH = Math.min(window.h, H - 0.42);
  const windowY =
    windowH > 1.8
      ? F + windowH / 2 + 0.035
      : Math.min(B + H - 0.3 - windowH / 2, F + 1.05 + windowH / 2);
  const doorW =
    config.doorStyle === "personnel"
      ? 0.914
      : Math.min(config.doorStyle === "vinyl" ? 2.438 : 1.83, L * 0.33);
  const doorH = Math.min(2.134, H - 0.34),
    doorX = L * 0.27;
  const frameOpening = (
    wall: THREE.Group,
    o: Opening,
    material: THREE.Material,
    thickness = 0.045,
  ) => {
    for (const x of [o.x - o.width / 2, o.x + o.width / 2])
      box(wall, thickness, o.height + 0.08, 0.1, x, o.y, 0.035, material, true);
    for (const y of [o.y - o.height / 2, o.y + o.height / 2])
      box(wall, o.width + thickness, 0.045, 0.1, o.x, y, 0.035, material, true);
    // The reveal occupies the wall depth, linking the exterior steel to the interior lining.
    for (const x of [o.x - o.width / 2 + 0.02, o.x + o.width / 2 - 0.02])
      box(wall, 0.02, o.height, 0.085, x, o.y, -0.017, white);
    for (const y of [o.y - o.height / 2 + 0.015, o.y + o.height / 2 - 0.015])
      box(wall, o.width, 0.02, 0.085, o.x, y, -0.017, white);
  };
  const shutter = (wall: THREE.Group, o: Opening) => {
    frameOpening(wall, o, chrome, 0.065);
    box(
      wall,
      o.width + 0.16,
      0.19,
      0.22,
      o.x,
      o.y + o.height / 2 + 0.08,
      0.085,
      white,
      true,
    );
    const count = Math.ceil(o.height / 0.065),
      geometry = new THREE.BoxGeometry(
        o.width - 0.055,
        o.height / count - 0.002,
        0.024,
      );
    const slats = new THREE.InstancedMesh(geometry, chrome, count);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      matrix.makeTranslation(
        o.x,
        o.y - o.height / 2 + ((i + 0.5) * o.height) / count,
        0.033,
      );
      slats.setMatrixAt(i, matrix);
    }
    slats.castShadow = true;
    slats.receiveShadow = true;
    wall.add(slats);
    box(wall, 0.19, 0.025, 0.055, o.x, o.y - o.height / 2 + 0.2, 0.06, frame);
  };
  const liningMaterial = () => {
    if (config.walls === "steel") return paint;
    if (config.walls === "wood" || config.walls === "concrete") {
      const material = assets.pbr(
        config.walls === "wood" ? "wood/natural-oak" : "walls/concrete",
        config.walls === "wood" ? "#ded4bc" : "#e0e1da",
      );
      material.side = THREE.DoubleSide;
      return material;
    }
    return new THREE.MeshStandardMaterial({
      color: config.walls === "dark" ? "#363a37" : "#eeeee8",
      roughness: config.walls === "white-steel" ? 0.46 : 0.85,
      metalness: config.walls === "white-steel" ? 0.15 : 0,
      side: THREE.DoubleSide,
    });
  };
  const addWall = (
    width: number,
    height: number,
    openings: Opening[],
    x: number,
    z: number,
    rotation: number,
  ) => {
    const wall = new THREE.Group();
    wall.position.set(x, F, z);
    wall.rotation.y = rotation;
    root.add(wall);
    const translated = openings.map((o) => ({ ...o, y: o.y - F }));
    const exterior = new THREE.Mesh(
      corrugatedWall(width, height, translated),
      paint,
    );
    exterior.castShadow = true;
    exterior.receiveShadow = true;
    wall.add(exterior);
    const interior = new THREE.Mesh(
      corrugatedWall(
        width,
        height,
        translated,
        config.walls === "steel" || config.walls === "white-steel" ? 0.017 : 0,
      ),
      liningMaterial(),
    );
    interior.position.z = -0.058;
    interior.receiveShadow = true;
    wall.add(interior);
    if (!["steel", "white-steel"].includes(config.walls)) {
      // Skirting follows solid wall spans so it never crosses a doorway.
      const floorGaps = translated
        .filter((o) => o.y - o.height / 2 < 0.1)
        .sort((a, b) => a.x - b.x);
      let start = -width / 2;
      for (const end of [
        ...floorGaps.map((o) => ({
          left: o.x - o.width / 2,
          right: o.x + o.width / 2,
        })),
        { left: width / 2, right: width / 2 },
      ]) {
        if (end.left > start)
          box(
            wall,
            end.left - start,
            0.075,
            0.015,
            (start + end.left) / 2,
            0.038,
            -0.066,
            config.walls === "dark" ? frame : white,
          );
        start = end.right;
      }
    }
    for (const o of translated) {
      if (o.kind === "roll-up") {
        shutter(wall, o);
        continue;
      }
      const vinyl = o.kind === "door" && config.doorStyle === "vinyl";
      frameOpening(wall, o, vinyl ? white : frame);
      if (o.kind === "window" || config.doorStyle === "sliding" || vinyl) {
        const panes =
          o.kind === "window"
            ? config.windowStyle === "small" || config.windowStyle === "picture"
              ? 1
              : 2
            : 2;
        for (let i = 0; i < panes; i++) {
          const paneW = (o.width - 0.06) / panes;
          box(
            wall,
            paneW - 0.025,
            o.height - 0.065,
            0.012,
            o.x - o.width / 2 + 0.03 + paneW * (i + 0.5),
            o.y,
            i % 2 === 0 ? 0.021 : -0.003,
            glass,
          ).castShadow = false;
          if (i > 0)
            box(
              wall,
              0.028,
              o.height - 0.04,
              0.065,
              o.x - o.width / 2 + 0.03 + paneW * i,
              o.y,
              0.027,
              vinyl ? white : frame,
            );
        }
        if (o.kind === "door") {
          box(wall, 0.022, 0.21, 0.025, o.x + 0.05, o.y - 0.12, 0.073, frame);
          for (const delta of [-0.02, 0.02])
            box(
              wall,
              o.width,
              0.014,
              0.02,
              o.x,
              o.y - o.height / 2 + 0.023,
              0.035 + delta,
              chrome,
            );
        }
      } else {
        box(
          wall,
          o.width - 0.06,
          o.height - 0.06,
          0.048,
          o.x,
          o.y,
          0.027,
          white,
          true,
        );
        box(
          wall,
          0.016,
          0.105,
          0.035,
          o.x + o.width / 2 - 0.13,
          o.y - 0.08,
          0.073,
          chrome,
          true,
        );
        for (const y of [o.y - o.height * 0.32, o.y + o.height * 0.32])
          box(
            wall,
            0.025,
            0.1,
            0.07,
            o.x - o.width / 2 + 0.016,
            y,
            0.04,
            chrome,
            true,
          );
      }
    }
    return wall;
  };
  for (const side of ["left", "right"] as const) {
    const sign = side === "left" ? 1 : -1,
      openings: Opening[] = [];
    if (
      config.windowStyle !== "none" &&
      (config.windowSide === side || config.windowSide === "both")
    )
      openings.push({
        x: -L * 0.26 * sign,
        y: windowY,
        width: windowW,
        height: windowH,
        kind: "window",
      });
    if (config.doorStyle !== "none" && config.doorSide === side)
      openings.push({
        x: doorX * sign,
        y: F + doorH / 2 + 0.025,
        width: doorW,
        height: doorH,
        kind: config.doorStyle === "roll-up" ? "roll-up" : "door",
      });
    addWall(
      L - 0.18,
      H + B - F - 0.075,
      openings,
      0,
      sign * (W / 2 - 0.018),
      side === "left" ? 0 : Math.PI,
    );
  }
  const rearOpening: Opening[] = config.rearRollup
    ? [{ x: 0, y: F + 1.05, width: 1.9, height: 2.1, kind: "roll-up" }]
    : [];
  const rear = addWall(
    W - 0.18,
    H + B - F - 0.075,
    rearOpening,
    -L / 2 + 0.02,
    0,
    -Math.PI / 2,
  );
  if (config.vents)
    for (const x of [-0.83, 0.83]) {
      box(rear, 0.32, 0.3, 0.065, x, H - 0.5, 0.05, chrome, true);
      for (let i = 0; i < 7; i++)
        box(rear, 0.26, 0.016, 0.025, x, H - 0.61 + i * 0.032, 0.091, rubber);
    }
  // Original cargo doors: recessed corrugated leaves, weather seals, four locking bars.
  const cargo = new THREE.Group();
  cargo.position.set(L / 2 + 0.016, F, 0);
  cargo.rotation.y = Math.PI / 2;
  root.add(cargo);
  const leafWidth = (W - 0.23) / 2,
    leafHeight = H + B - F - 0.12;
  for (const sign of [-1, 1]) {
    const hinge = new THREE.Group();
    hinge.position.x = sign * (W / 2 - 0.115);
    hinge.rotation.y = config.cargoOpen ? sign * Math.PI * 0.63 : 0;
    cargo.add(hinge);
    const center = (-sign * leafWidth) / 2;
    const leafGeometry = corrugatedWall(leafHeight, leafWidth, [], 0.025, 0.54);
    leafGeometry.rotateZ(Math.PI / 2);
    leafGeometry.translate(leafWidth / 2, leafHeight / 2, 0);
    const leaf = new THREE.Mesh(leafGeometry, paint);
    leaf.position.x = center;
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    hinge.add(leaf);
    for (const edge of [center - leafWidth / 2, center + leafWidth / 2])
      box(
        hinge,
        0.035,
        leafHeight,
        0.055,
        edge,
        leafHeight / 2,
        0.028,
        paint,
        true,
      );
    for (const y of [0.035, leafHeight - 0.035])
      box(hinge, leafWidth, 0.065, 0.055, center, y, 0.033, paint, true);
    box(
      hinge,
      0.013,
      leafHeight,
      0.06,
      center - (sign * leafWidth) / 2,
      leafHeight / 2,
      0.039,
      rubber,
    );
    for (const delta of [-leafWidth * 0.28, leafWidth * 0.28]) {
      const x = center + delta;
      pipe(hinge, 0.015, leafHeight - 0.11, x, leafHeight / 2, 0.072);
      for (const y of [
        0.11,
        leafHeight * 0.3,
        leafHeight * 0.71,
        leafHeight - 0.11,
      ])
        box(hinge, 0.062, 0.065, 0.042, x, y, 0.081, chrome, true);
      box(hinge, 0.21, 0.027, 0.035, x - sign * 0.09, 0.88, 0.1, chrome, true);
      box(hinge, 0.07, 0.105, 0.027, x, 0.88, 0.108, chrome, true);
    }
    for (const y of [0.28, 0.82, 1.45, leafHeight - 0.25])
      box(hinge, 0.12, 0.06, 0.085, sign * 0.014, y, 0.047, chrome, true);
  }
  if (!config.cutaway) {
    const roof = new THREE.Mesh(
      corrugatedWall(L - 0.12, W - 0.12, [], 0.012),
      paint,
    );
    roof.rotation.x = -Math.PI / 2;
    roof.position.set(0, B + H - 0.045, (W - 0.12) / 2);
    roof.castShadow = true;
    root.add(roof);
    if (config.walls !== "steel" && config.walls !== "white-steel") {
      const ceiling = new THREE.Mesh(physicalPlane(L - 0.2, W - 0.16), white);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.position.y = B + H - 0.085;
      root.add(ceiling);
    }
  }
  if (config.steps && config.doorStyle !== "none") {
    const sign = config.doorSide === "left" ? 1 : -1;
    for (let i = 0; i < 2; i++)
      box(
        root,
        Math.min(doorW, 1.6),
        0.025,
        0.3,
        doorX,
        0.1 + i * 0.12,
        sign * (W / 2 + 0.5 - i * 0.24),
        chrome,
      );
    for (const x of [doorX - 0.6, doorX + 0.6])
      box(root, 0.035, 0.28, 0.035, x, 0.14, sign * (W / 2 + 0.33), chrome);
  }
  if (config.lights) {
    const lightMat = new THREE.MeshStandardMaterial({
      color: "#fff3d8",
      emissive: "#ffe2b0",
      emissiveIntensity: 1.3,
    });
    for (const x of [-L * 0.24, L * 0.24]) {
      const fixture = pipe(root, 0.045, 0.016, x, B + H - 0.1, 0, lightMat);
      fixture.castShadow = false;
      const light = new THREE.PointLight("#fff0d5", 2.3, 5, 2);
      light.position.set(x, B + H - 0.23, 0);
      root.add(light);
    }
  }
  if (config.ac) {
    const indoor = new THREE.Group();
    indoor.name = "indoor-ac-slot";
    indoor.position.set(0, B + H - 0.42, -W / 2 + 0.22);
    root.add(indoor);
    const outdoor = new THREE.Group();
    outdoor.name = "outdoor-ac-slot";
    outdoor.position.set(0, 0.49, -W / 2 - 0.35);
    outdoor.rotation.y = Math.PI;
    root.add(outdoor);
    for (const x of [-0.28, 0.28]) {
      box(root, 0.038, 0.36, 0.038, x, 0.63, -W / 2 - 0.08, chrome);
      box(root, 0.038, 0.038, 0.48, x, 0.47, -W / 2 - 0.29, chrome);
    }
    const serviceTop = B + H - 0.42;
    pipe(
      root,
      0.022,
      serviceTop - 0.8,
      0.51,
      (serviceTop + 0.8) / 2,
      -W / 2 - 0.08,
      white,
    );
  }
  // Static fittings and shell sections share one draw call per material.
  root.updateMatrixWorld(true);
  const batches = new Map<THREE.Material, THREE.Mesh[]>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (
      !mesh.isMesh ||
      (mesh as THREE.InstancedMesh).isInstancedMesh ||
      Array.isArray(mesh.material) ||
      mesh.material === glass
    )
      return;
    const list = batches.get(mesh.material) || [];
    list.push(mesh);
    batches.set(mesh.material, list);
  });
  const replaced = new Set<THREE.BufferGeometry>();
  batches.forEach((meshes, material) => {
    if (meshes.length < 2) return;
    const parts = meshes.map((mesh) => {
      const geometry = mesh.geometry.index
        ? mesh.geometry.toNonIndexed()
        : mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);
      return geometry;
    });
    const merged = mergeGeometries(parts);
    parts.forEach((part) => part.dispose());
    if (!merged) return;
    const combined = new THREE.Mesh(merged, material);
    combined.castShadow = meshes.some((mesh) => mesh.castShadow);
    combined.receiveShadow = meshes.some((mesh) => mesh.receiveShadow);
    root.add(combined);
    meshes.forEach((mesh) => {
      replaced.add(mesh.geometry);
      mesh.removeFromParent();
    });
  });
  // A shared geometry can also remain in a single unbatched mesh.
  const retained = new Set<THREE.BufferGeometry>();
  root.traverse((object) => {
    if ((object as THREE.Mesh).isMesh)
      retained.add((object as THREE.Mesh).geometry);
  });
  replaced.forEach((geometry) => {
    if (!retained.has(geometry)) geometry.dispose();
  });
  root.userData.paint = paint;
  return root;
}

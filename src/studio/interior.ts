import * as THREE from "three";
import { LayoutItem, catalogItem } from "./layout";
import { StudioAssets } from "./assets";

/** Lightweight built-ins shared by the plan and 3D studio. Dimensions are metres. */
export function buildInterior(layout: LayoutItem[], floorY: number) {
  const root = new THREE.Group();
  root.name = "Interior layout";
  if (!layout.length) return root;
  const material = (color: string, roughness = 0.8, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const timber = material("#b5916f");
  const timberDark = material("#856b55");
  const upholstery = material("#b8bbb3", 0.94);
  const cushion = material("#d2d1c9", 0.96);
  const white = material("#eeeae2");
  const porcelain = material("#fafaf7", 0.25);
  const metal = material("#858c89", 0.32, 0.62);
  const glass = material("#b9d2d3", 0.12, 0.08);
  const dark = material("#2e3737", 0.62);
  const floorTile = material("#d5d6d1", 0.72);

  const box = (group: THREE.Group, w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, floorY + y, z);
    mesh.castShadow = h > 0.15;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const leg = (group: THREE.Group, x: number, z: number, height: number, mat = timberDark) => box(group, 0.045, height, 0.045, x, height / 2, z, mat);
  const table = (group: THREE.Group, width: number, depth: number, height: number, mat = timber) => {
    box(group, width, 0.055, depth, 0, height, 0, mat);
    for (const x of [-width / 2 + 0.09, width / 2 - 0.09]) for (const z of [-depth / 2 + 0.08, depth / 2 - 0.08]) leg(group, x, z, height - 0.03);
  };

  for (const item of layout) {
    const group = new THREE.Group();
    group.name = `${item.kind}-${item.id}`;
    group.position.set(item.x, 0, item.z);
    group.rotation.y = item.rotation === 90 ? Math.PI / 2 : 0;
    root.add(group);
    switch (item.kind) {
      case "bathroom": {
        box(group, 1.55, 0.025, 2.18, 0, 0.018, 0, floorTile);
        const partitionX = item.x < 0 ? 0.74 : -0.74;
        box(group, 0.08, 2.2, 0.79, partitionX, 1.1, -0.695, white);
        box(group, 0.08, 2.2, 0.59, partitionX, 1.1, 0.795, white);
        box(group, 0.08, 0.14, 0.8, partitionX, 2.13, 0.1, white);
        // Shower tray and a glass screen at the far corner.
        box(group, 0.72, 0.065, 0.78, -0.32, 0.07, -0.64, porcelain);
        box(group, 0.025, 1.65, 0.78, 0.05, 0.91, -0.64, glass);
        box(group, 0.035, 0.65, 0.035, -0.59, 1.44, -0.88, metal);
        box(group, 0.18, 0.045, 0.035, -0.59, 1.78, -0.88, metal);
        // Toilet and a small vanity keep the module realistic at 20 ft scale.
        box(group, 0.38, 0.37, 0.5, -0.22, 0.22, 0.35, porcelain);
        box(group, 0.4, 0.05, 0.53, -0.22, 0.42, 0.35, white);
        box(group, 0.32, 0.49, 0.24, -0.55, 0.3, 0.87, timber);
        box(group, 0.33, 0.04, 0.26, -0.55, 0.57, 0.87, porcelain);
        break;
      }
      case "kitchenette": {
        box(group, 1.55, 0.83, 0.56, 0, 0.415, 0, white);
        box(group, 1.58, 0.055, 0.6, 0, 0.855, 0, timber);
        for (const x of [-0.48, 0, 0.48]) box(group, 0.012, 0.72, 0.015, x, 0.42, 0.29, timberDark);
        box(group, 0.42, 0.018, 0.35, -0.42, 0.889, 0.01, metal);
        box(group, 0.025, 0.22, 0.025, -0.42, 1.01, -0.12, metal);
        for (const x of [0.28, 0.53]) {
          const hob = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.008, 18), dark);
          hob.position.set(x, floorY + 0.89, 0);
          group.add(hob);
        }
        break;
      }
      case "partition": {
        box(group, 0.09, 2.14, 0.68, 0, 1.07, -0.72, white);
        box(group, 0.09, 2.14, 0.63, 0, 1.07, 0.745, white);
        box(group, 0.09, 0.1, 0.81, 0, 2.09, 0.03, white);
        break;
      }
      case "sofa": {
        box(group, 1.62, 0.28, 0.78, 0, 0.28, 0, upholstery);
        box(group, 1.54, 0.14, 0.6, 0, 0.48, -0.04, cushion);
        box(group, 1.62, 0.63, 0.15, 0, 0.57, 0.31, upholstery);
        for (const x of [-0.73, 0.73]) box(group, 0.16, 0.45, 0.72, x, 0.43, 0, upholstery);
        for (const x of [-0.65, 0.65]) leg(group, x, -0.24, 0.13, dark);
        break;
      }
      case "coffee-table": table(group, 0.72, 0.48, 0.36); break;
      case "dining-table": table(group, 1.05, 0.68, 0.73); break;
      case "desk": table(group, 1.2, 0.58, 0.74, timberDark); break;
      case "chair": {
        box(group, 0.5, 0.06, 0.5, 0, 0.47, 0, timber);
        box(group, 0.5, 0.47, 0.06, 0, 0.7, 0.22, timber);
        for (const x of [-0.2, 0.2]) for (const z of [-0.2, 0.2]) leg(group, x, z, 0.45);
        break;
      }
      case "bed": {
        box(group, 1.9, 0.27, 1.38, 0, 0.24, 0, timberDark);
        box(group, 1.84, 0.18, 1.32, 0, 0.48, 0, cushion);
        box(group, 1.9, 0.75, 0.07, 0, 0.43, 0.65, timber);
        for (const x of [-0.44, 0.44]) box(group, 0.57, 0.07, 0.32, x, 0.62, 0.42, white);
        break;
      }
      case "storage": {
        box(group, 0.95, 1.8, 0.45, 0, 0.9, 0, timber);
        box(group, 0.015, 1.65, 0.02, 0, 0.91, 0.235, timberDark);
        for (const x of [-0.12, 0.12]) box(group, 0.018, 0.13, 0.028, x, 1.05, 0.25, metal);
        break;
      }
    }
  }
  return root;
}

/** Replace the lightweight plan placeholders with the bundled detailed models. */
export async function upgradeInteriorAssets(
  root: THREE.Group,
  layout: LayoutItem[],
  floorY: number,
  assets: StudioAssets,
  isCurrent: () => boolean,
) {
  const fit = async (
    target: THREE.Group,
    key: string,
    x: number,
    z: number,
    width: number,
    depth: number,
    lift = 0,
  ) => {
    const model = await assets.interiorModel(key);
    if (!isCurrent()) return;
    model.visible = true;
    model.traverse((object) => {
      object.visible = true;
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.visible = true;
      // Some of the source GLBs have stale/undersized bounding spheres. Rebuild
      // both local bounds from their vertex buffers so Three does not cull them.
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();
      mesh.frustumCulled = false;
      mesh.renderOrder = 1;
      const style = `${mesh.name} ${Array.isArray(mesh.material) ? mesh.material.map((m) => m.name).join(" ") : mesh.material.name}`.toLowerCase();
      mesh.material = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((original) => {
        const label = `${style} ${original.name}`.toLowerCase();
        const material = original.clone() as THREE.MeshStandardMaterial;
        material.transparent = false;
        material.opacity = 1;
        material.depthWrite = true;
        material.side = THREE.DoubleSide;
        if (/fabric|linen|uphol|cushion|textile|cloth/.test(label)) {
          const realistic = assets.pbr("furniture/wool_boucle");
          realistic.name = `${original.name}-boucle`;
          return realistic;
        }
        if (/wood|walnut|oak|carcass|front|drawer|frame|seat/.test(label)) {
          const realistic = assets.pbr("wood/natural-oak", "#ded4bc");
          realistic.name = `${original.name}-oak`;
          return realistic;
        }
        if (/metal|chrome|steel|brass|handle|tap|hinge/.test(label)) {
          material.metalness = 0.78;
          material.roughness = 0.28;
        }
        if (/ceramic|porcelain|basin|toilet|bath/.test(label)) material.roughness = 0.18;
        return original;
      });
    });
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const scale = Math.min(width / Math.max(size.x, 0.001), depth / Math.max(size.z, 0.001));
    const placement = new THREE.Matrix4()
      .makeTranslation(
        x - ((bounds.min.x + bounds.max.x) / 2) * scale,
        floorY + lift - bounds.min.y * scale,
        z - ((bounds.min.z + bounds.max.z) / 2) * scale,
      )
      .multiply(new THREE.Matrix4().makeScale(scale, scale, scale));
    const fitted = new THREE.Group();
    fitted.name = `fitted-${key}`;
    model.traverse((object) => {
      const source = object as THREE.Mesh;
      if (!source.isMesh) return;
      const geometry = source.geometry.clone();
      geometry.applyMatrix4(source.matrixWorld);
      geometry.applyMatrix4(placement);
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      const mesh = new THREE.Mesh(geometry, source.material);
      mesh.name = source.name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      mesh.renderOrder = 1;
      fitted.add(mesh);
    });
    target.add(fitted);
  };

  for (const item of layout) {
    if (!isCurrent()) return;
    const placeholder = root.getObjectByName(`${item.kind}-${item.id}`) as THREE.Group | undefined;
    if (!placeholder?.parent) continue;
    const replacement = new THREE.Group();
    replacement.name = `detailed-${item.kind}-${item.id}`;
    replacement.position.copy(placeholder.position);
    replacement.rotation.copy(placeholder.rotation);
    const size = catalogItem(item.kind);
    try {
      if (item.kind === "sofa") await fit(replacement, "sofa", 0, 0, size.width, size.depth);
      else if (item.kind === "coffee-table") await fit(replacement, "coffeeTable", 0, 0, size.width, size.depth);
      else if (item.kind === "dining-table") await fit(replacement, "diningTable", 0, 0, size.width, size.depth);
      else if (item.kind === "chair") await fit(replacement, "chair", 0, 0, size.width, size.depth);
      else if (item.kind === "bed") await fit(replacement, "bed", 0, 0, size.width, size.depth);
      else if (item.kind === "desk") await fit(replacement, "desk", 0, 0, size.width, size.depth);
      else if (item.kind === "storage") await fit(replacement, "storage", 0, 0, size.width, size.depth);
      else if (item.kind === "kitchenette") {
        await fit(replacement, "kitchenSink", -0.31, 0, 0.6, size.depth);
        await fit(replacement, "kitchenBase", 0.31, 0, 0.6, size.depth);
        await fit(replacement, "kitchenWall", 0.31, -0.03, 0.6, 0.34, 1.28);
      } else if (item.kind === "bathroom") {
        await fit(replacement, "vanity", -0.38, 0.65, 0.72, 0.47);
        await fit(replacement, "toilet", -0.36, -0.46, 0.42, 0.58);
        await fit(replacement, "showerTray", 0.39, -0.57, 0.71, 0.71);
        await fit(replacement, "shower", 0.39, -0.57, 0.71, 0.71);
      } else continue;
      if (!isCurrent()) return;
      if (replacement.children.length === 0) {
        throw new Error(`No model meshes loaded for ${item.kind}`);
      }
      placeholder.visible = false;
      placeholder.parent.add(replacement);
    } catch (error) {
      if (isCurrent()) {
        console.warn(`Detailed ${item.kind} model failed to load; keeping the plan placeholder.`, error);
      }
    }
  }
}

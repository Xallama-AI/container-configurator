// Original split AC head, authored for this project and released under CC0.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mkdir, writeFile } from "node:fs/promises";
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((result) => {
      this.result =
        "data:" +
        blob.type +
        ";base64," +
        Buffer.from(result).toString("base64");
      this.onloadend?.();
    });
  }
};
const root = new THREE.Group();
root.name = "Wall-mounted split air conditioner";
const white = new THREE.MeshStandardMaterial({
  color: "#f2f1ed",
  roughness: 0.32,
});
const dark = new THREE.MeshStandardMaterial({
  color: "#252b2c",
  roughness: 0.68,
});
function part(w, h, d, x, y, z, material, rounded = false) {
  const mesh = new THREE.Mesh(
    rounded
      ? new RoundedBoxGeometry(w, h, d, 3, Math.min(0.025, h * 0.2, d * 0.2))
      : new THREE.BoxGeometry(w, h, d),
    material,
  );
  mesh.position.set(x, y, z);
  root.add(mesh);
}
part(0.82, 0.27, 0.19, 0, 0, 0, white, true);
part(0.78, 0.15, 0.033, 0, 0.039, 0.09, white, true);
part(0.73, 0.047, 0.006, 0, -0.089, 0.097, dark);
for (let i = 0; i < 6; i++)
  part(0.715, 0.002, 0.015, 0, -0.108 + i * 0.006, 0.1, white);
part(0.74, 0.023, 0.022, 0, -0.119, 0.098, white, true);
for (let i = 0; i < 9; i++)
  part(0.72, 0.002, 0.032, 0, 0.117, 0.048 - i * 0.006, dark);
part(0.035, 0.019, 0.002, 0.32, -0.032, 0.11, dark, true);
part(
  0.005,
  0.005,
  0.003,
  0.31,
  -0.03,
  0.112,
  new THREE.MeshStandardMaterial({
    color: "#799482",
    emissive: "#547966",
    emissiveIntensity: 0.2,
  }),
);
const target = new URL(
  "../public/container-configurator/models/ac/",
  import.meta.url,
);
await mkdir(target, { recursive: true });
const result = await new GLTFExporter().parseAsync(root, { binary: true });
await writeFile(new URL("indoor-split.glb", target), Buffer.from(result));
console.log("Indoor split GLB:", result.byteLength, "bytes");

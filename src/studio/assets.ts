import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";

const BASE = "/container-configurator";
const INTERIOR_MODELS: Record<string, string> = {
  sofa: "bedroom-and-living-room-furniture/sofa-two-seat-904fa140.glb",
  coffeeTable: "bedroom-and-living-room-furniture/dining-table-6seat-02f48ab1.glb",
  diningTable: "bedroom-and-living-room-furniture/dining-table-6seat-02f48ab1.glb",
  chair: "bedroom-and-living-room-furniture/dining-chair-upholst-7ec33345.glb",
  bed: "bedroom-and-living-room-furniture/double-bed-upholster-4c7d1e0e.glb",
  desk: "bedroom-and-living-room-furniture/desk-writing-2f6be817.glb",
  storage: "bedroom-and-living-room-furniture/wardrobe-2-door-de288b64.glb",
  kitchenBase: "fitted-kitchen-and-bathroom-builder/base-600-89129dae.glb",
  kitchenSink: "fitted-kitchen-and-bathroom-builder/base-600-sink-a65b92b5.glb",
  kitchenWall: "fitted-kitchen-and-bathroom-builder/wall-600-8d2afd7f.glb",
  vanity: "fitted-kitchen-and-bathroom-builder/vanity-800-24368157.glb",
  toilet: "fitted-kitchen-and-bathroom-builder/wc-close-coupled-13e88a96.glb",
  shower: "fitted-kitchen-and-bathroom-builder/shower-enclosure-s-b2c77076.glb",
  showerTray: "fitted-kitchen-and-bathroom-builder/shower-tray-square-f1ac59e0.glb",
};
function disposeModel(root: THREE.Group) {
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    for (const material of Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) textures.add(value);
      }
    }
  });
  textures.forEach((texture) => texture.dispose());
  disposeTree(root, true);
}
export function disposeTree(root: THREE.Object3D, includeShared = false) {
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (includeShared || !mesh.userData.sharedAsset) geometries.add(mesh.geometry);
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => {
      if (!m.userData.sharedAssetMaterial) materials.add(m);
    });
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  root.clear();
}
export class StudioAssets {
  private textures = new Map<string, THREE.Texture>();
  private models = new Map<string, Promise<THREE.Group>>();
  private loadedModels: THREE.Group[] = [];
  private disposed = false;
  constructor(
    private invalidate: () => void,
    private onError: (message: string) => void,
  ) {}
  texture(path: string, color = false) {
    if (this.textures.has(path)) return this.textures.get(path)!;
    const texture = new THREE.TextureLoader().load(
      BASE + path,
      () => {
        if (this.disposed) texture.dispose();
        else this.invalidate();
      },
      undefined,
      () => this.onError("A material could not load. Please refresh to retry."),
    );
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    this.textures.set(path, texture);
    return texture;
  }
  paintTexture() {
    const key = "paint-microstructure";
    if (this.textures.has(key)) return this.textures.get(key)!;
    const pixels = new Uint8Array(128 * 128 * 4);
    let seed = 71;
    for (let i = 0; i < pixels.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const shade = 180 + (seed % 65);
      pixels[i] = pixels[i + 1] = pixels[i + 2] = shade;
      pixels[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, 128, 128, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(14, 14);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    this.textures.set(key, texture);
    return texture;
  }
  pbr(folder: string, color = "#ffffff") {
    const prefix = folder === "furniture/wool_boucle" ? "wool_boucle-" : "";
    const arm = this.texture(`/textures/${folder}/${prefix}arm.webp`);
    return new THREE.MeshStandardMaterial({
      color,
      map: this.texture(`/textures/${folder}/${prefix}color.webp`, true),
      normalMap: this.texture(`/textures/${folder}/${prefix}normal.webp`),
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughnessMap: arm,
      aoMap: arm,
      aoMapIntensity: 0.5,
      roughness: 1,
    });
  }
  async environment(renderer: THREE.WebGLRenderer) {
    const hdr = await new HDRLoader().loadAsync(
      BASE + "/environment/overcast-1k.hdr",
    );
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose();
    pmrem.dispose();
    if (this.disposed) {
      environment.dispose();
      return null;
    }
    return environment;
  }
  async ac(kind: "indoor" | "outdoor") {
    if (!this.models.has(kind))
      this.models.set(
        kind,
        new GLTFLoader()
          .loadAsync(
            `${BASE}/models/ac/${kind === "indoor" ? "indoor-split" : "outdoor-condenser"}.glb`,
          )
          .then((gltf) => {
            const root = gltf.scene;
            if (this.disposed) {
              disposeModel(root);
              throw new Error("Scene closed");
            }
            this.loadedModels.push(root);
            return root;
          }),
      );
    const root = (await this.models.get(kind)!).clone(true);
    root.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map((material) => material.clone())
          : mesh.material.clone();
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.sharedAsset = true;
      }
    });
    return root;
  }
  async interiorModel(key: string) {
    const path = INTERIOR_MODELS[key];
    if (!path) throw new Error(`Unknown interior model: ${key}`);
    if (!this.models.has(`interior:${key}`)) {
      this.models.set(`interior:${key}`, new GLTFLoader().loadAsync(`${BASE}/models/interior/${path}`).then((gltf) => {
        const root = gltf.scene;
        if (this.disposed) {
          disposeModel(root);
          throw new Error("Scene closed");
        }
        this.loadedModels.push(root);
        return root;
      }));
    }
    const root = (await this.models.get(`interior:${key}`)!).clone(true);
    root.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((material) => material.clone())
        : mesh.material.clone();
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.sharedAsset = true;
    });
    return root;
  }
  dispose() {
    this.disposed = true;
    this.textures.forEach((t) => t.dispose());
    this.textures.clear();
    this.loadedModels.forEach(disposeModel);
    this.loadedModels = [];
    this.models.clear();
  }
}

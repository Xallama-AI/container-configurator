import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";

const BASE = "/container-configurator";
const INTERIOR_MODELS: Record<string, string> = {
  sofa: "sofa_02/sofa_02_1k.gltf",
  coffeeTable: "modern_coffee_table_01/modern_coffee_table_01_1k.gltf",
  diningTable: "wooden_table_02/wooden_table_02_1k.gltf",
  chair: "dining_chair_02/dining_chair_02_1k.gltf",
  bed: "vintage_day_bed/vintage_day_bed_1k.gltf",
  desk: "metal_office_desk/metal_office_desk_1k.gltf",
  storage: "drawer_cabinet/drawer_cabinet_1k.gltf",
};
const interiorSources = new Map<string, Promise<THREE.Group>>();

function interiorSource(key: string) {
  const path = INTERIOR_MODELS[key];
  if (!path) return Promise.reject(new Error(`Unknown interior model: ${key}`));
  if (!interiorSources.has(key)) {
    const promise = new GLTFLoader()
      .loadAsync(`${BASE}/models/polyhaven/${path}`)
      .then((gltf) => gltf.scene)
      .catch((error) => {
        interiorSources.delete(key);
        throw error;
      });
    interiorSources.set(key, promise);
  }
  return interiorSources.get(key)!;
}

export async function preloadStudioAssets(onProgress: (loaded: number, total: number) => void) {
  const keys = Object.keys(INTERIOR_MODELS);
  const folders = ["grass", "wood/warm-wood", "wood/dark-walnut", "wood/light-oak", "wood/natural-oak", "walls/concrete"];
  const textures = folders.flatMap((folder) => ["color", "normal", "arm"].map((channel) => `${BASE}/textures/${folder}/${channel}.webp`));
  const total = keys.length + textures.length;
  let loaded = 0;
  onProgress(loaded, total);
  await Promise.all([
    ...keys.map(async (key) => {
      await interiorSource(key);
      onProgress(++loaded, total);
    }),
    ...textures.map((url) => new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => { onProgress(++loaded, total); resolve(); };
      image.onerror = () => reject(new Error(`Could not load ${url}`));
      image.src = url;
    })),
  ]);
}
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
  private pendingTextures = new Set<Promise<void>>();
  private textureError = false;
  private models = new Map<string, Promise<THREE.Group>>();
  private loadedModels: THREE.Group[] = [];
  private disposed = false;
  constructor(
    private invalidate: () => void,
    private onError: (message: string) => void,
  ) {}
  texture(path: string, color = false) {
    if (this.textures.has(path)) return this.textures.get(path)!;
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => { finish = resolve; });
    this.pendingTextures.add(pending);
    void pending.then(() => this.pendingTextures.delete(pending));
    const texture = new THREE.TextureLoader().load(
      BASE + path,
      () => {
        if (this.disposed) texture.dispose();
        else this.invalidate();
        finish();
      },
      undefined,
      () => {
        this.textureError = true;
        this.onError("A material could not load. Please refresh to retry.");
        finish();
      },
    );
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    this.textures.set(path, texture);
    return texture;
  }
  async whenTexturesReady() {
    await Promise.all([...this.pendingTextures]);
    if (this.textureError) throw new Error("A material could not load.");
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
    const source = await interiorSource(key);
    if (this.disposed) throw new Error("Scene closed");
    const root = source.clone(true);
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
